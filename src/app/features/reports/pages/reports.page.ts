import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WorkspaceStore } from '../../../core/services/workspace.store';
import { ReportsApiService } from '../../../infrastructure/http/reports-api.service';
import { ReportSection } from '../../../shared/models/report.model';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { LoadingIndicatorComponent } from '../../../shared/ui/loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingIndicatorComponent, ErrorMessageComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <h2>14. Reportes y Exportación</h2>
        <p>Exportación de resultados a Excel/PDF y selección de secciones del reporte.</p>
      </header>

      <div *ngIf="store.activeDataset(); else noDataset" class="page-grid">
        <article class="card span-5">
          <h3>Configuración de reporte</h3>
          <form class="form-grid" [formGroup]="form" (ngSubmit)="export()">
            <label>
              <span>Título</span>
              <input formControlName="title" />
            </label>
            <label>
              <span>Formato</span>
              <select formControlName="format">
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel</option>
              </select>
            </label>
            <fieldset class="sections">
              <legend>Secciones</legend>
              <label *ngFor="let section of sections">
                <input
                  type="checkbox"
                  [checked]="section.enabled"
                  (change)="toggleSection(section.id)"
                />
                <span>{{ section.title }}</span>
              </label>
            </fieldset>
            <button class="primary" type="submit" [disabled]="form.invalid || loading()">Exportar</button>
          </form>
        </article>

        <article class="card span-7">
          <h3>Vista previa y artefacto</h3>
          <p><strong>Secciones activas:</strong> {{ enabledSections() }}</p>
          <app-loading-indicator [show]="loading()" [label]="'Generando reporte...'" />
          <app-error-message [message]="error()" />
          <div *ngIf="result() as artifact" class="result">
            <p><strong>Archivo:</strong> {{ artifact.fileName }}</p>
            <p><strong>Formato:</strong> {{ artifact.format }}</p>
            <p><strong>Fecha:</strong> {{ artifact.createdAt | date:'medium' }}</p>
          </div>
        </article>
      </div>

      <ng-template #noDataset>
        <article class="empty-state">
          Importa un dataset primero en <a routerLink="/data-import">Carga de Datos</a>.
        </article>
      </ng-template>
    </section>
  `,
  styles: [`
    fieldset {
      border: 1px solid #d0dfe5;
      border-radius: 10px;
      padding: 10px;
      margin: 0;
      display: grid;
      gap: 8px;
    }
    legend {
      padding: 0 6px;
      color: #1f566b;
    }
    .sections label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .result {
      border: 1px solid #d8e6ea;
      border-radius: 10px;
      padding: 10px;
      background: #f8fcfd;
    }
    .result p {
      margin: 0 0 6px;
    }
  `]
})
export class ReportsPageComponent {
  readonly store = inject(WorkspaceStore);
  private readonly reportsApi = inject(ReportsApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<{ fileName: string; format: string; createdAt: string } | null>(null);

  readonly form = new FormGroup({
    title: new FormControl('Reporte Analítico', { nonNullable: true, validators: Validators.required }),
    format: new FormControl<'pdf' | 'xlsx'>('pdf', { nonNullable: true, validators: Validators.required })
  });

  readonly sections: ReportSection[] = [
    { id: 'summary', title: 'Resumen Ejecutivo', enabled: true },
    { id: 'cleaning', title: 'Limpieza y Transformación', enabled: true },
    { id: 'descriptive', title: 'Estadística Descriptiva', enabled: true },
    { id: 'charts', title: 'Visualizaciones', enabled: true },
    { id: 'inference', title: 'Inferencia', enabled: false }
  ];

  enabledSections(): string {
    return this.sections.filter((section) => section.enabled).map((section) => section.title).join(', ');
  }

  toggleSection(sectionId: string): void {
    const section = this.sections.find((item) => item.id === sectionId);
    if (section) {
      section.enabled = !section.enabled;
    }
  }

  export(): void {
    const dataset = this.store.activeDataset();
    if (!dataset) {
      this.error.set('No hay dataset disponible.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.reportsApi.export({
      datasetId: dataset.id,
      format: this.form.controls.format.value,
      title: this.form.controls.title.value,
      sections: this.sections
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (artifact) => this.result.set(artifact),
        error: (error: Error) => this.error.set(error.message)
      });
  }
}
