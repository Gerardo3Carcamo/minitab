import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WorkspaceStore } from '../../../core/services/workspace.store';
import { CleaningApiService } from '../../../infrastructure/http/cleaning-api.service';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { LoadingIndicatorComponent } from '../../../shared/ui/loading-indicator/loading-indicator.component';
import { MissingValuesPanelComponent } from '../components/missing-values-panel.component';
import { OutlierDetectionPanelComponent } from '../components/outlier-detection-panel.component';
import { TransformationBuilderComponent } from '../components/transformation-builder.component';

@Component({
  selector: 'app-data-cleaning-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MissingValuesPanelComponent,
    OutlierDetectionPanelComponent,
    TransformationBuilderComponent,
    LoadingIndicatorComponent,
    ErrorMessageComponent
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <h2>3. Limpieza y Transformación</h2>
        <p>Manejo de faltantes, outliers y transformaciones (log, sqrt, box-cox y normalización).</p>
      </header>

      <div *ngIf="store.activeDataset(); else noDataset" class="page-grid">
        <div class="span-4">
          <app-missing-values-panel [columns]="allColumns()" (action)="runAction($event.action, $event.payload)" />
        </div>
        <div class="span-4">
          <app-outlier-detection-panel [numericColumns]="numericColumns()" (action)="runAction($event.action, $event.payload)" />
        </div>
        <div class="span-4">
          <app-transformation-builder [columns]="numericColumns()" (action)="runAction($event.action, $event.payload)" />
        </div>

        <div class="span-12 card">
          <h3>Estado de ejecución</h3>
          <app-loading-indicator [show]="loading()" [label]="'Aplicando cambios en dataset...'" />
          <app-error-message [message]="error()" />
          <p *ngIf="lastAction()" class="hint">Última acción: {{ lastAction() }}</p>
        </div>
      </div>

      <ng-template #noDataset>
        <article class="empty-state">
          Para limpiar datos primero importa un dataset en <a routerLink="/data-import">Carga de Datos</a>.
        </article>
      </ng-template>
    </section>
  `,
  styles: [`
    .hint {
      margin: 10px 0 0;
      color: #496977;
    }
  `]
})
export class DataCleaningPageComponent {
  readonly store = inject(WorkspaceStore);
  private readonly cleaningApi = inject(CleaningApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastAction = signal<string | null>(null);

  readonly allColumns = computed(() =>
    this.store.activeDataset()?.columns.map((column) => ({ key: column.key, label: column.label })) ?? []
  );

  readonly numericColumns = computed(() =>
    this.store.activeDataset()?.columns
      .filter((column) => column.type === 'numeric')
      .map((column) => ({ key: column.key, label: column.label })) ?? []
  );

  runAction(action: string, payload: Record<string, unknown>): void {
    const dataset = this.store.activeDataset();
    if (!dataset) {
      this.error.set('No hay dataset en workspace.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const finalPayload = action === 'normalize-column-names'
      ? {
        renameMap: Object.fromEntries(
          dataset.columns.map((column) => [
            column.key,
            column.key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
          ])
        )
      }
      : payload;

    this.cleaningApi.applyAction({
      datasetId: dataset.id,
      action: action as Parameters<CleaningApiService['applyAction']>[0]['action'],
      payload: finalPayload
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (updatedDataset) => {
          this.store.setDataset(updatedDataset);
          this.lastAction.set(action);
        },
        error: (error: Error) => this.error.set(error.message)
      });
  }
}
