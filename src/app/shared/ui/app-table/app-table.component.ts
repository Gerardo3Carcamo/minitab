import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

export interface AppTableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th *ngFor="let column of columns()" (click)="sortRequested.emit(column.key)">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows(); let rowIndex = index">
            <td *ngFor="let column of columns()">
              <input
                [value]="valueOf(row, column.key)"
                (change)="onCellChange($event, rowIndex, column.key)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-wrap {
      overflow: auto;
      border: 1px solid #d8e6ea;
      border-radius: 12px;
      background: #fff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 780px;
    }
    th, td {
      padding: 9px 10px;
      border-bottom: 1px solid #edf3f5;
      text-align: left;
    }
    th {
      position: sticky;
      top: 0;
      background: #f5fafb;
      cursor: pointer;
      color: #1b4a5d;
    }
    td input {
      width: 100%;
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 4px 6px;
      background: transparent;
      font: inherit;
    }
    td input:focus {
      border-color: #3d93ad;
      background: #f8fcfd;
      outline: none;
    }
  `]
})
export class AppTableComponent {
  readonly columns = input.required<AppTableColumn[]>();
  readonly rows = input.required<Array<Record<string, string | number | boolean | null>>>();

  readonly sortRequested = output<string>();
  readonly cellChanged = output<{ rowIndex: number; columnKey: string; value: string }>();

  valueOf(row: Record<string, string | number | boolean | null>, key: string): string {
    const value = row[key];
    return value === null || value === undefined ? '' : String(value);
  }

  onCellChange(event: Event, rowIndex: number, columnKey: string): void {
    const target = event.target as HTMLInputElement;
    this.cellChanged.emit({ rowIndex, columnKey, value: target.value });
  }
}
