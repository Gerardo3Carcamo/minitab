import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { WorkspaceStore } from '../../../core/services/workspace.store';
import { ModuleRunnerApiService, type AnalysisModule } from '../../../infrastructure/http/module-runner-api.service';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { LoadingIndicatorComponent } from '../../../shared/ui/loading-indicator/loading-indicator.component';

interface PageData {
  module: AnalysisModule;
  title: string;
  description: string;
  analyses: string[];
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
          <h3>Configuración</h3>
          <form class="form-grid" [formGroup]="form" (ngSubmit)="run()">
            <label>
              <span>Tipo de análisis</span>
              <select formControlName="analysisType">
                <option *ngFor="let option of data.analyses" [value]="option">{{ option }}</option>
              </select>
            </label>
            <label>
              <span>Parámetros (JSON)</span>
              <textarea rows="8" formControlName="params"></textarea>
            </label>
            <button class="primary" type="submit" [disabled]="form.invalid || loading()">Ejecutar</button>
          </form>
        </article>

        <article class="card span-8">
          <h3>Resultado</h3>
          <app-loading-indicator [show]="loading()" [label]="'Ejecutando análisis...'" />
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
  `]
})
export class AnalysisWorkbenchPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly moduleRunnerApi = inject(ModuleRunnerApiService);
  private readonly workspaceStore = inject(WorkspaceStore);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<string>('');

  readonly data: PageData = this.route.snapshot.data as PageData;

  readonly form = new FormGroup({
    analysisType: new FormControl(this.data.analyses[0] ?? '', { nonNullable: true, validators: Validators.required }),
    params: new FormControl('{\n  "alpha": 0.05,\n  "confidence_level": 0.95\n}', { nonNullable: true, validators: Validators.required })
  });

  run(): void {
    let params: Record<string, unknown>;
    try {
      params = JSON.parse(this.form.controls.params.value);
    } catch {
      this.error.set('El JSON de parámetros no es válido.');
      return;
    }

    const activeDataset = this.workspaceStore.activeDataset();
    if (activeDataset && params['dataset_id'] === undefined && params['datasetId'] === undefined) {
      params['dataset_id'] = activeDataset.id;
    }

    this.loading.set(true);
    this.error.set(null);
    this.moduleRunnerApi.run(this.data.module, {
      analysisType: this.form.controls.analysisType.value,
      ...params
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => this.result.set(JSON.stringify(result, null, 2)),
        error: (error: Error) => this.error.set(error.message)
      });
  }
}
