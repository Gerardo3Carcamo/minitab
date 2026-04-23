import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { Dataset } from '../../../shared/models/dataset.model';
import { MetricCardComponent } from '../../../shared/ui/metric-card/metric-card.component';

@Component({
  selector: 'app-dataset-summary-card',
  standalone: true,
  imports: [CommonModule, MetricCardComponent],
  template: `
    <section class="card">
      <h3>DatasetSummaryCardComponent</h3>
      <div *ngIf="dataset(); else empty" class="metrics-grid">
        <app-metric-card label="Nombre" [value]="dataset()!.name" />
        <app-metric-card label="Filas" [value]="dataset()!.rows.length" />
        <app-metric-card label="Columnas" [value]="dataset()!.columns.length" />
        <app-metric-card label="Origen" [value]="dataset()!.sourceFile" />
      </div>
      <ng-template #empty>
        <div class="empty-state">No hay dataset en el workspace.</div>
      </ng-template>
    </section>
  `
})
export class DatasetSummaryCardComponent {
  readonly dataset = input<Dataset | null>(null);
}
