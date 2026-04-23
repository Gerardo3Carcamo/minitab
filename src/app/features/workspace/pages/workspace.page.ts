import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkspaceStore } from '../../../core/services/workspace.store';
import { DatasetColumn } from '../../../shared/models/dataset.model';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { MetricCardComponent } from '../../../shared/ui/metric-card/metric-card.component';
import { ColumnInspectorComponent } from '../components/column-inspector.component';
import { DataTableComponent } from '../components/data-table.component';
import { DatasetSummaryCardComponent } from '../components/dataset-summary-card.component';
import { FilterBuilderComponent, WorkspaceFilter } from '../components/filter-builder.component';

type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-workspace-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatasetSummaryCardComponent,
    DataTableComponent,
    ColumnInspectorComponent,
    FilterBuilderComponent,
    ErrorMessageComponent,
    MetricCardComponent
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <h2>2. Gestión del Workspace</h2>
        <p>Vista tabular, edición básica, filtros, ordenamiento, búsqueda y resumen del dataset.</p>
      </header>

      <div *ngIf="store.activeDataset(); else noDataset" class="page-grid">
        <div class="span-8">
          <app-dataset-summary-card [dataset]="store.activeDataset()" />
        </div>
        <div class="span-4 card">
          <h3>Resumen rápido</h3>
          <div class="metrics-grid">
            <app-metric-card label="Filas visibles" [value]="displayRows().length" />
            <app-metric-card label="Nulos detectados" [value]="store.nullValues()" />
          </div>
          <app-error-message [message]="store.error()" />
        </div>

        <div class="span-4">
          <app-column-inspector
            [columns]="store.activeDataset()!.columns"
            (rename)="onRenameColumn($event.key, $event.label)"
            (toggleVisible)="store.toggleColumnVisibility($event)"
          />
        </div>
        <div class="span-8">
          <app-filter-builder
            [columns]="columnOptions()"
            (changed)="filter.set($event)"
          />
        </div>

        <div class="span-12">
          <app-data-table
            [columns]="visibleColumns()"
            [rows]="displayRows()"
            (cellChanged)="onCellChanged($event.rowIndex, $event.columnKey, $event.value)"
            (sortRequested)="onSortRequested($event)"
          />
        </div>
      </div>

      <ng-template #noDataset>
        <article class="empty-state">
          No hay dataset importado. Ve a <a routerLink="/data-import">Carga de Datos</a> para comenzar.
        </article>
      </ng-template>
    </section>
  `
})
export class WorkspacePageComponent {
  readonly store = inject(WorkspaceStore);

  readonly filter = signal<WorkspaceFilter>({
    search: '',
    columnKey: '',
    value: '',
    showNullsOnly: false
  });
  readonly sort = signal<{ key: string; direction: SortDirection } | null>(null);

  readonly visibleColumns = computed(() => this.store.activeDataset()?.columns.filter((column) => !column.hidden) ?? []);
  readonly displayRows = computed(() => {
    const dataset = this.store.activeDataset();
    if (!dataset) {
      return [];
    }

    const currentFilter = this.filter();
    let rows = [...dataset.rows];

    if (currentFilter.search.length > 0) {
      const query = currentFilter.search.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(query))
      );
    }

    if (currentFilter.columnKey && currentFilter.value.length > 0) {
      const target = currentFilter.value.toLowerCase();
      rows = rows.filter((row) => String(row[currentFilter.columnKey] ?? '').toLowerCase().includes(target));
    }

    if (currentFilter.showNullsOnly) {
      rows = rows.filter((row) => Object.values(row).some((value) => value === null || value === ''));
    }

    const sort = this.sort();
    if (sort) {
      rows.sort((left, right) => {
        const leftValue = left[sort.key];
        const rightValue = right[sort.key];
        const compare = String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, { numeric: true });
        return sort.direction === 'asc' ? compare : -compare;
      });
    }

    return rows;
  });

  columnOptions() {
    return this.store.activeDataset()?.columns.map((column) => ({ key: column.key, label: column.label })) ?? [];
  }

  onRenameColumn(columnKey: string, label: string): void {
    if (label.length === 0) {
      return;
    }
    this.store.renameColumn(columnKey, label);
  }

  onSortRequested(columnKey: string): void {
    const current = this.sort();
    if (!current || current.key !== columnKey) {
      this.sort.set({ key: columnKey, direction: 'asc' });
      return;
    }
    this.sort.set({
      key: columnKey,
      direction: current.direction === 'asc' ? 'desc' : 'asc'
    });
  }

  onCellChanged(rowIndex: number, columnKey: string, rawValue: string): void {
    const dataset = this.store.activeDataset();
    if (!dataset) {
      return;
    }
    const targetRow = this.displayRows()[rowIndex];
    const sourceIndex = dataset.rows.indexOf(targetRow);
    if (sourceIndex < 0) {
      return;
    }

    const column = dataset.columns.find((item) => item.key === columnKey);
    const value = this.castValue(column, rawValue);
    this.store.updateCell(sourceIndex, columnKey, value);
  }

  private castValue(column: DatasetColumn | undefined, rawValue: string): string | number | boolean | null {
    if (rawValue.trim().length === 0) {
      return null;
    }
    if (!column) {
      return rawValue;
    }
    if (column.type === 'numeric') {
      const numeric = Number(rawValue);
      return Number.isFinite(numeric) ? numeric : rawValue;
    }
    if (column.type === 'boolean') {
      return rawValue.toLowerCase() === 'true';
    }
    return rawValue;
  }
}
