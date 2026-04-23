import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { DatasetPreview } from '../../../shared/models/dataset.model';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';

@Component({
  selector: 'app-dataset-preview',
  standalone: true,
  imports: [CommonModule, AppTableComponent],
  template: `
    <section class="card">
      <header class="header">
        <div>
          <h3>Preview del Dataset</h3>
          <p *ngIf="preview()">Filas: {{ preview()?.totalRows }} | Columnas: {{ preview()?.totalColumns }}</p>
        </div>
        <button class="primary" type="button" *ngIf="preview()" (click)="importClicked.emit()">
          Importar al Workspace
        </button>
      </header>

      <div *ngIf="preview(); else empty">
        <app-table
          [columns]="tableColumns()"
          [rows]="preview()!.rows"
        />
      </div>

      <ng-template #empty>
        <div class="empty-state">No hay preview disponible.</div>
      </ng-template>
    </section>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
      margin-bottom: 10px;
    }
    h3 {
      margin: 0;
    }
    p {
      margin: 4px 0 0;
      color: #5e7783;
      font-size: 0.9rem;
    }
  `]
})
export class DatasetPreviewComponent {
  readonly preview = input<DatasetPreview | null>(null);
  readonly importClicked = output<void>();

  tableColumns() {
    const preview = this.preview();
    if (!preview) {
      return [];
    }
    return preview.columns.map((column) => ({ key: column.key, label: column.label }));
  }
}
