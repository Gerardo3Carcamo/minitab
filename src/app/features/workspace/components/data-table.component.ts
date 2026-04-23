import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { DatasetColumn, DatasetRow } from '../../../shared/models/dataset.model';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, AppTableComponent],
  template: `
    <section class="card">
      <h3>DataTableComponent</h3>
      <app-table
        [columns]="tableColumns()"
        [rows]="rows()"
        (cellChanged)="cellChanged.emit($event)"
        (sortRequested)="sortRequested.emit($event)"
      />
    </section>
  `
})
export class DataTableComponent {
  readonly columns = input<DatasetColumn[]>([]);
  readonly rows = input<DatasetRow[]>([]);
  readonly cellChanged = output<{ rowIndex: number; columnKey: string; value: string }>();
  readonly sortRequested = output<string>();

  tableColumns() {
    return this.columns().map((column) => ({
      key: column.key,
      label: column.label
    }));
  }
}
