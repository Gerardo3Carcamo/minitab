import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WorkspaceStore } from '../../../core/services/workspace.store';
import { DescriptiveApiService } from '../../../infrastructure/http/descriptive-api.service';
import { DescriptiveStatsResult } from '../../../shared/models/analysis.model';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { LoadingIndicatorComponent } from '../../../shared/ui/loading-indicator/loading-indicator.component';
import { MetricCardComponent } from '../../../shared/ui/metric-card/metric-card.component';

@Component({
  selector: 'app-descriptive-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MetricCardComponent,
    LoadingIndicatorComponent,
    ErrorMessageComponent
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <h2>4. Estadística Descriptiva</h2>
        <p>Media, mediana, moda, varianza, desviación estándar, percentiles y frecuencias.</p>
      </header>

      <div *ngIf="store.activeDataset(); else noDataset" class="page-grid">
        <article class="card span-4">
          <h3>Configuración</h3>
          <form class="form-grid" [formGroup]="form" (ngSubmit)="run()">
            <label>
              <span>Columnas (separadas por coma)</span>
              <input formControlName="columns" />
            </label>
            <label>
              <span>Percentiles</span>
              <input formControlName="percentiles" placeholder="25,50,75,90" />
            </label>
            <button class="primary" type="submit" [disabled]="form.invalid || loading()">Ejecutar</button>
          </form>
          <p class="hint">Disponibles: {{ availableColumns() }}</p>
        </article>

        <article class="card span-8">
          <h3>Resultados</h3>
          <app-loading-indicator [show]="loading()" [label]="'Ejecutando descriptiva...'" />
          <app-error-message [message]="error()" />

          <div *ngIf="result()" class="metrics-grid">
            <app-metric-card
              *ngFor="let metric of result()!.summary"
              [label]="metric.label"
              [value]="metric.value"
            />
          </div>
        </article>

        <article class="card span-12" *ngIf="result() as stats">
          <h3>Detalle por columna</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Columna</th>
                  <th>Media</th>
                  <th>Mediana</th>
                  <th>Moda</th>
                  <th>Varianza</th>
                  <th>Desv. Est.</th>
                  <th>Mín</th>
                  <th>Máx</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let column of stats.columns">
                  <td>{{ column.column }}</td>
                  <td>{{ format(column.mean) }}</td>
                  <td>{{ format(column.median) }}</td>
                  <td>{{ format(column.mode) }}</td>
                  <td>{{ format(column.variance) }}</td>
                  <td>{{ format(column.standardDeviation) }}</td>
                  <td>{{ format(column.min) }}</td>
                  <td>{{ format(column.max) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <ng-template #noDataset>
        <article class="empty-state">
          Debes importar un dataset primero en <a routerLink="/data-import">Carga de Datos</a>.
        </article>
      </ng-template>
    </section>
  `,
  styles: [`
    .hint {
      margin: 8px 0 0;
      color: #5f7a86;
      font-size: 0.9rem;
    }
    .table-wrap {
      overflow: auto;
      border: 1px solid #d8e6ea;
      border-radius: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 740px;
    }
    th, td {
      padding: 8px 10px;
      border-bottom: 1px solid #edf3f5;
      text-align: left;
    }
    th {
      background: #f4fafb;
    }
  `]
})
export class DescriptiveStatsPageComponent {
  readonly store = inject(WorkspaceStore);
  private readonly descriptiveApi = inject(DescriptiveApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<DescriptiveStatsResult | null>(null);

  readonly availableColumns = computed(() =>
    this.store.activeDataset()?.columns.map((column) => column.key).join(', ') ?? ''
  );

  readonly form = new FormGroup({
    columns: new FormControl('temperature,pressure,defects', { validators: Validators.required, nonNullable: true }),
    percentiles: new FormControl('25,50,75,90', { validators: Validators.required, nonNullable: true })
  });

  run(): void {
    const dataset = this.store.activeDataset();
    if (!dataset) {
      this.error.set('No hay dataset cargado.');
      return;
    }

    const columns = this.form.controls.columns.value
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const percentiles = this.form.controls.percentiles.value
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value >= 0 && value <= 100);

    this.loading.set(true);
    this.error.set(null);
    this.descriptiveApi.runDescriptive({
      datasetId: dataset.id,
      columns,
      percentiles
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => this.result.set(result),
        error: (error: Error) => this.error.set(error.message)
      });
  }

  format(value: string | number | undefined): string {
    if (value === undefined) {
      return '-';
    }
    if (typeof value === 'string') {
      return value;
    }
    return Number.isInteger(value) ? value.toString() : value.toFixed(4);
  }
}
