import { Injectable, computed, signal } from '@angular/core';
import { Dataset, DatasetColumn, DatasetPreview, ImportJob } from '../../shared/models/dataset.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly _activeDataset = signal<Dataset | null>(null);
  private readonly _preview = signal<DatasetPreview | null>(null);
  private readonly _importHistory = signal<ImportJob[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly activeDataset = this._activeDataset.asReadonly();
  readonly preview = this._preview.asReadonly();
  readonly importHistory = this._importHistory.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly hasDataset = computed(() => this._activeDataset() !== null);
  readonly visibleColumns = computed(() => this._activeDataset()?.columns.filter((column) => !column.hidden) ?? []);
  readonly totalRows = computed(() => this._activeDataset()?.rows.length ?? 0);
  readonly totalColumns = computed(() => this._activeDataset()?.columns.length ?? 0);
  readonly nullValues = computed(() => {
    const dataset = this._activeDataset();
    if (!dataset) {
      return 0;
    }
    return dataset.rows.reduce((accumulator, row) => {
      const rowNulls = dataset.columns.filter((column) => row[column.key] === null || row[column.key] === '').length;
      return accumulator + rowNulls;
    }, 0);
  });

  setLoading(isLoading: boolean): void {
    this._loading.set(isLoading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  setPreview(preview: DatasetPreview | null): void {
    this._preview.set(preview);
  }

  addImportJob(job: ImportJob): void {
    this._importHistory.update((current) => [job, ...current].slice(0, 25));
  }

  setImportHistory(jobs: ImportJob[]): void {
    this._importHistory.set(jobs.slice(0, 25));
  }

  setDataset(dataset: Dataset): void {
    this._activeDataset.set(dataset);
    this._error.set(null);
  }

  clearDataset(): void {
    this._activeDataset.set(null);
    this._preview.set(null);
  }

  renameColumn(columnKey: string, newLabel: string): void {
    this._activeDataset.update((dataset) => {
      if (!dataset) {
        return dataset;
      }
      const columns = dataset.columns.map((column) =>
        column.key === columnKey ? { ...column, label: newLabel } : column
      );
      return { ...dataset, columns, updatedAt: new Date().toISOString() };
    });
  }

  toggleColumnVisibility(columnKey: string): void {
    this._activeDataset.update((dataset) => {
      if (!dataset) {
        return dataset;
      }
      const columns = dataset.columns.map((column) =>
        column.key === columnKey ? { ...column, hidden: !column.hidden } : column
      );
      return { ...dataset, columns, updatedAt: new Date().toISOString() };
    });
  }

  updateCell(rowIndex: number, columnKey: string, value: string | number | boolean | null): void {
    this._activeDataset.update((dataset) => {
      if (!dataset || rowIndex < 0 || rowIndex >= dataset.rows.length) {
        return dataset;
      }
      const rows = dataset.rows.map((row, index) => (index === rowIndex ? { ...row, [columnKey]: value } : row));
      return { ...dataset, rows, updatedAt: new Date().toISOString() };
    });
  }

  replaceDatasetRows(columns: DatasetColumn[], rows: Dataset['rows']): void {
    this._activeDataset.update((dataset) => {
      if (!dataset) {
        return dataset;
      }
      return {
        ...dataset,
        columns,
        rows,
        updatedAt: new Date().toISOString()
      };
    });
  }
}
