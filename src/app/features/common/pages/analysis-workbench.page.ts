import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, firstValueFrom, type Observable } from 'rxjs';
import { WorkspaceStore } from '../../../core/services/workspace.store';
import { DataImportApiService } from '../../../infrastructure/http/data-import-api.service';
import { ModuleRunnerApiService, type AnalysisModule } from '../../../infrastructure/http/module-runner-api.service';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { LoadingIndicatorComponent } from '../../../shared/ui/loading-indicator/loading-indicator.component';

interface PageData {
  module: AnalysisModule;
  title: string;
  description: string;
  analyses: string[];
}

interface AnalysisContract {
  required: string[];
  optional: string[];
  template: Record<string, unknown>;
}

@Component({
  selector: 'app-analysis-workbench-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingIndicatorComponent, ErrorMessageComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <h2>{{ data.title }}</h2>
        <p>{{ data.description }}</p>
      </header>

      <div class="page-grid">
        <article class="card span-4">
          <h3>Configuracion</h3>
          <form class="form-grid" [formGroup]="form" (ngSubmit)="run()">
            <label>
              <span>Tipo de analisis</span>
              <select formControlName="analysisType">
                <option *ngFor="let option of data.analyses" [value]="option">{{ option }}</option>
              </select>
            </label>
            <label>
              <span>Parametros (JSON)</span>
              <textarea rows="8" formControlName="params"></textarea>
            </label>
            <p class="hint" *ngIf="requiredFieldsHint() as hint">{{ hint }}</p>
            <div class="actions">
              <button class="primary" type="submit" [disabled]="form.invalid || loading()">Ejecutar</button>
              <button class="secondary" type="button" (click)="restoreTemplate()" [disabled]="loading()">
                Usar plantilla
              </button>
            </div>
          </form>
        </article>

        <article class="card span-8">
          <h3>Resultado</h3>
          <app-loading-indicator [show]="loading()" [label]="'Ejecutando analisis...'" />
          <app-error-message [message]="error()" />
          <pre *ngIf="result()">{{ result() }}</pre>
        </article>
      </div>
    </section>
  `,
  styles: [`
    pre {
      margin: 0;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #d8e6ea;
      background: #f7fbfd;
      white-space: pre-wrap;
      font-size: 0.88rem;
    }
    .hint {
      margin: 0;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid #d6e6eb;
      background: #f4fafc;
      color: #355a69;
      font-size: 0.84rem;
    }
    .actions {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }
  `]
})
export class AnalysisWorkbenchPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly moduleRunnerApi = inject(ModuleRunnerApiService);
  private readonly dataImportApi = inject(DataImportApiService);
  private readonly workspaceStore = inject(WorkspaceStore);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<string>('');

  readonly data: PageData = this.route.snapshot.data as PageData;

  readonly form = new FormGroup({
    analysisType: new FormControl(this.data.analyses[0] ?? '', { nonNullable: true, validators: Validators.required }),
    params: new FormControl(defaultParamsTemplate(this.data.module, this.data.analyses[0] ?? ''), {
      nonNullable: true,
      validators: Validators.required
    })
  });

  constructor() {
    this.form.controls.analysisType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((analysisType) => {
        const template = defaultParamsTemplate(this.data.module, analysisType);
        this.form.controls.params.setValue(template);
      });
  }

  requiredFieldsHint(): string {
    const contract = resolveAnalysisContract(this.data.module, this.form.controls.analysisType.value);
    if (!contract) {
      return 'Revisa en el manual los campos obligatorios para este analisis.';
    }
    const visibleRequired = contract.required.filter((field) => field !== 'dataset_id');
    if (visibleRequired.length === 0) {
      return 'dataset_id se toma automatico del dataset activo.';
    }
    return `Campos obligatorios: ${visibleRequired.join(', ')}. dataset_id se toma automatico del dataset activo.`;
  }

  restoreTemplate(): void {
    const template = defaultParamsTemplate(this.data.module, this.form.controls.analysisType.value);
    this.form.controls.params.setValue(template);
  }

  async run(): Promise<void> {
    let params: Record<string, unknown>;
    try {
      const parsed = JSON.parse(this.form.controls.params.value);
      if (!isRecord(parsed)) {
        this.error.set('Los parametros deben ser un objeto JSON de clave y valor.');
        return;
      }
      params = normalizeInputAliases(parsed);
    } catch {
      this.error.set('El JSON de parametros no es valido.');
      return;
    }

    if (params['alpha'] === undefined && typeof params['confidence_level'] === 'number') {
      const confidenceLevel = Number(params['confidence_level']);
      if (confidenceLevel > 0 && confidenceLevel < 1) {
        params['alpha'] = 1 - confidenceLevel;
      }
    }
    delete params['confidence_level'];

    if (!(await this.ensureDatasetId(params))) {
      return;
    }

    const analysisType = this.form.controls.analysisType.value;
    const validationError = validateParams(this.data.module, analysisType, params);
    if (validationError) {
      this.error.set(validationError);
      return;
    }

    const safeParams = sanitizeParams(this.data.module, analysisType, params);

    this.loading.set(true);
    this.error.set(null);

    let request$: Observable<Record<string, unknown>>;
    try {
      request$ = this.moduleRunnerApi.run(this.data.module, {
        analysisType,
        ...safeParams
      });
    } catch (error) {
      this.loading.set(false);
      this.error.set(error instanceof Error ? error.message : 'No se pudo preparar la solicitud.');
      return;
    }

    request$
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => this.result.set(JSON.stringify(result, null, 2)),
        error: (error: Error) => this.error.set(error.message)
      });
  }

  private async ensureDatasetId(params: Record<string, unknown>): Promise<boolean> {
    if (!isMissingValue(params['dataset_id'])) {
      return true;
    }

    const activeDataset = this.workspaceStore.activeDataset();
    if (activeDataset) {
      params['dataset_id'] = activeDataset.id;
      return true;
    }

    try {
      const latestDataset = await firstValueFrom(this.dataImportApi.getLatestDatasetFromWorkspace());
      if (latestDataset) {
        this.workspaceStore.setDataset(latestDataset);
        params['dataset_id'] = latestDataset.id;
        return true;
      }
    } catch {
      // El mensaje final se maneja abajo.
    }

    this.error.set(
      'No se encontro dataset activo. Carga/importa datos primero en "Carga de Datos".'
    );
    return false;
  }
}

function defaultParamsTemplate(module: AnalysisModule, analysisType: string): string {
  const template = resolveAnalysisContract(module, analysisType)?.template ?? null;
  if (!template) {
    return JSON.stringify({ alpha: 0.05 }, null, 2);
  }
  return JSON.stringify(template, null, 2);
}

function resolveAnalysisContract(module: AnalysisModule, analysisType: string): AnalysisContract | null {
  const normalizedAnalysis = analysisType.toLowerCase();
  if (module !== 'inference') {
    return null;
  }

  if (normalizedAnalysis.includes('intervalo')) {
    return {
      required: ['dataset_id', 'column'],
      optional: ['alpha'],
      template: {
        column: '<numeric_column>',
        alpha: 0.05
      }
    };
  }

  if (normalizedAnalysis.includes('prueba t')) {
    return {
      required: ['dataset_id', 'column', 'population_mean'],
      optional: ['alpha'],
      template: {
        column: '<numeric_column>',
        population_mean: 0,
        alpha: 0.05
      }
    };
  }

  if (normalizedAnalysis.includes('anova')) {
    return {
      required: ['dataset_id', 'column', 'group_column'],
      optional: ['alpha'],
      template: {
        column: '<numeric_column>',
        group_column: '<group_column>',
        alpha: 0.05
      }
    };
  }

  if (normalizedAnalysis.includes('chi')) {
    return {
      required: ['dataset_id', 'column_a', 'column_b'],
      optional: ['alpha'],
      template: {
        column_a: '<categorical_column_a>',
        column_b: '<categorical_column_b>',
        alpha: 0.05
      }
    };
  }

  if (normalizedAnalysis.includes('param')) {
    return {
      required: ['dataset_id', 'test', 'column'],
      optional: ['group_column', 'group_a', 'group_b', 'alpha'],
      template: {
        test: 'mannwhitney',
        column: '<numeric_column>',
        group_column: '<group_column>',
        group_a: 'A',
        group_b: 'B',
        alpha: 0.05
      }
    };
  }

  if (normalizedAnalysis.includes('compar')) {
    return {
      required: ['dataset_id', 'dataset2_id', 'column1', 'column2'],
      optional: ['equal_var', 'alpha'],
      template: {
        dataset2_id: '<dataset_id_2>',
        column1: '<numeric_column_1>',
        column2: '<numeric_column_2>',
        equal_var: false,
        alpha: 0.05
      }
    };
  }

  return null;
}

function validateParams(module: AnalysisModule, analysisType: string, params: Record<string, unknown>): string | null {
  const contract = resolveAnalysisContract(module, analysisType);
  if (!contract) {
    return null;
  }

  const missing = contract.required.filter((key) => {
    const value = params[key];
    return isMissingValue(value) || isTemplatePlaceholder(value);
  });

  if (missing.length > 0) {
    const mismatch = getMismatchHint(analysisType, params);
    return `Faltan campos obligatorios para "${analysisType}": ${missing.join(', ')}.${mismatch ? ` ${mismatch}` : ''}`;
  }

  if (params['alpha'] !== undefined) {
    const alpha = Number(params['alpha']);
    if (!Number.isFinite(alpha) || alpha <= 0 || alpha >= 1) {
      return 'El campo "alpha" debe ser numerico y estar entre 0 y 1.';
    }
  }

  return null;
}

function getMismatchHint(analysisType: string, params: Record<string, unknown>): string {
  const normalized = analysisType.toLowerCase();

  if (normalized.includes('chi') && (params['column'] !== undefined || params['population_mean'] !== undefined)) {
    return 'Elegiste Chi-cuadrada, pero el JSON parece de Prueba t. Usa "column_a" y "column_b".';
  }

  if (normalized.includes('prueba t') && (params['column_a'] !== undefined || params['column_b'] !== undefined)) {
    return 'Elegiste Prueba t, pero el JSON parece de Chi-cuadrada. Usa "column" y "population_mean".';
  }

  return '';
}

function sanitizeParams(module: AnalysisModule, analysisType: string, params: Record<string, unknown>): Record<string, unknown> {
  const contract = resolveAnalysisContract(module, analysisType);
  if (!contract) {
    return params;
  }

  const allowed = new Set([...contract.required, ...contract.optional]);
  return Object.fromEntries(
    Object.entries(params).filter(([key, value]) => allowed.has(key) && value !== undefined)
  );
}

function normalizeInputAliases(input: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...input };

  applyAlias(normalized, 'datasetId', 'dataset_id');
  applyAlias(normalized, 'dataset2Id', 'dataset2_id');
  applyAlias(normalized, 'columnA', 'column_a');
  applyAlias(normalized, 'columnB', 'column_b');
  applyAlias(normalized, 'groupColumn', 'group_column');
  applyAlias(normalized, 'populationMean', 'population_mean');
  applyAlias(normalized, 'confidenceLevel', 'confidence_level');

  return normalized;
}

function applyAlias(target: Record<string, unknown>, sourceKey: string, targetKey: string): void {
  if (target[targetKey] === undefined && target[sourceKey] !== undefined) {
    target[targetKey] = target[sourceKey];
  }
  delete target[sourceKey];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMissingValue(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0);
}

function isTemplatePlaceholder(value: unknown): boolean {
  return typeof value === 'string' && /^<.+>$/.test(value.trim());
}
