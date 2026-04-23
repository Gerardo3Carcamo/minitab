import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

export interface WorkspaceFilter {
  search: string;
  columnKey: string;
  value: string;
  showNullsOnly: boolean;
}

@Component({
  selector: 'app-filter-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <h3>FilterBuilderComponent</h3>
      <form [formGroup]="form" class="form-grid" (ngSubmit)="apply()">
        <label>
          <span>Búsqueda global</span>
          <input formControlName="search" />
        </label>
        <div class="form-grid cols-2">
          <label>
            <span>Columna</span>
            <select formControlName="columnKey">
              <option value="">Todas</option>
              <option *ngFor="let column of columns()" [value]="column.key">{{ column.label }}</option>
            </select>
          </label>
          <label>
            <span>Valor contiene</span>
            <input formControlName="value" />
          </label>
        </div>
        <label class="inline">
          <input type="checkbox" formControlName="showNullsOnly" />
          <span>Solo filas con nulos</span>
        </label>
        <button class="primary" type="submit">Aplicar filtros</button>
      </form>
    </section>
  `,
  styles: [`
    .inline {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class FilterBuilderComponent {
  readonly columns = input<Array<{ key: string; label: string }>>([]);
  readonly changed = output<WorkspaceFilter>();

  readonly form = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    columnKey: new FormControl('', { nonNullable: true }),
    value: new FormControl('', { nonNullable: true }),
    showNullsOnly: new FormControl(false, { nonNullable: true })
  });

  apply(): void {
    this.changed.emit({
      search: this.form.controls.search.value.trim(),
      columnKey: this.form.controls.columnKey.value,
      value: this.form.controls.value.value.trim(),
      showNullsOnly: this.form.controls.showNullsOnly.value
    });
  }
}
