import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import {
  CleaningActionRequest,
  ColumnDescriptiveStats,
  DescriptiveStatsRequest,
  DescriptiveStatsResult,
  SummaryMetric
} from '../../shared/models/analysis.model';
import { ChartRequest, ChartResult, ChartSeries } from '../../shared/models/chart.model';
import { Dataset, DatasetColumn, DatasetPreview, DatasetRow, ImportJob, UploadDatasetRequest } from '../../shared/models/dataset.model';
import { ReportArtifact, ReportRequest } from '../../shared/models/report.model';
import { MOCK_EXCEL_SHEETS, createSeedDataset } from './mock-data';

@Injectable({ providedIn: 'root' })
export class MockApiService {
  private readonly datasets = new Map<string, Dataset>();
  private readonly imports = new Map<string, { job: ImportJob; dataset: Dataset }>();

  uploadDataset(payload: UploadDatasetRequest): Observable<ImportJob> {
    const dataset = this.buildDataset(payload);
    const preview = this.buildPreview(dataset);
    const jobId = this.createId('import');
    const job: ImportJob = {
      id: jobId,
      fileName: payload.fileName,
      fileType: payload.fileType,
      progress: 100,
      status: 'completed',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      errors: [],
      selectedColumns: payload.selectedColumns,
      rowRange: payload.rowRange,
      sheetName: payload.sheetName ?? (payload.fileType === 'xlsx' || payload.fileType === 'xls' ? MOCK_EXCEL_SHEETS[0] : undefined),
      preview
    };

    this.imports.set(jobId, { job, dataset });
    return of(job).pipe(delay(550));
  }

  importToWorkspace(importJobId: string): Observable<Dataset> {
    const imported = this.imports.get(importJobId);
    if (!imported) {
      return throwError(() => new Error('No existe el import solicitado.'));
    }
    const dataset = { ...imported.dataset, rows: imported.dataset.rows.map((row) => ({ ...row })) };
    this.datasets.set(dataset.id, dataset);
    return of(dataset).pipe(delay(300));
  }

  getDataset(datasetId: string): Observable<Dataset> {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) {
      return throwError(() => new Error('Dataset no encontrado en mock.'));
    }
    return of({
      ...dataset,
      columns: dataset.columns.map((column) => ({ ...column })),
      rows: dataset.rows.map((row) => ({ ...row }))
    }).pipe(delay(200));
  }

  getImportHistory(): Observable<ImportJob[]> {
    const jobs = Array.from(this.imports.values()).map((item) => item.job);
    return of(jobs.sort((a, b) => b.startedAt.localeCompare(a.startedAt))).pipe(delay(220));
  }

  applyCleaning(payload: CleaningActionRequest): Observable<Dataset> {
    const dataset = this.datasets.get(payload.datasetId);
    if (!dataset) {
      return throwError(() => new Error('No hay dataset cargado en workspace.'));
    }

    let columns = dataset.columns.map((column) => ({ ...column }));
    let rows = dataset.rows.map((row) => ({ ...row }));

    switch (payload.action) {
      case 'handle-missing': {
        const strategy = String(payload.payload['strategy'] ?? 'drop-rows');
        const columnKey = String(payload.payload['column'] ?? '');
        const value = payload.payload['value'] as string | number | undefined;
        if (strategy === 'drop-rows') {
          rows = rows.filter((row) => columns.every((column) => row[column.key] !== null && row[column.key] !== ''));
        } else {
          rows = rows.map((row) => {
            const current = row[columnKey];
            if (current === null || current === '') {
              return { ...row, [columnKey]: value ?? 0 };
            }
            return row;
          });
        }
        break;
      }
      case 'replace-values': {
        const columnKey = String(payload.payload['column'] ?? '');
        const search = String(payload.payload['search'] ?? '');
        const replace = payload.payload['replace'] as string | number | null;
        rows = rows.map((row) => (String(row[columnKey] ?? '') === search ? { ...row, [columnKey]: replace } : row));
        break;
      }
      case 'drop-columns': {
        const columnKey = String(payload.payload['column'] ?? '');
        columns = columns.filter((column) => column.key !== columnKey);
        rows = rows.map((row) => {
          const copy = { ...row };
          delete copy[columnKey];
          return copy;
        });
        break;
      }
      case 'transform': {
        const columnKey = String(payload.payload['column'] ?? '');
        const kind = String(payload.payload['kind'] ?? 'log');
        rows = rows.map((row) => {
          const current = Number(row[columnKey]);
          if (!Number.isFinite(current) || current <= 0) {
            return row;
          }
          const transformed =
            kind === 'sqrt' ? Math.sqrt(current) :
            kind === 'box-cox' ? (Math.pow(current, 0.5) - 1) / 0.5 :
            Math.log(current);
          return { ...row, [columnKey]: Number(transformed.toFixed(5)) };
        });
        break;
      }
      case 'normalize-column-names': {
        const mapping = new Map<string, string>();
        columns = columns.map((column) => {
          const normalized = column.key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
          mapping.set(column.key, normalized);
          return { ...column, key: normalized, label: column.label.trim() };
        });
        rows = rows.map((row) => {
          const normalizedRow: DatasetRow = {};
          for (const [key, value] of Object.entries(row)) {
            normalizedRow[mapping.get(key) ?? key] = value;
          }
          return normalizedRow;
        });
        break;
      }
      default:
        break;
    }

    const updated: Dataset = {
      ...dataset,
      columns,
      rows,
      updatedAt: new Date().toISOString()
    };

    this.datasets.set(updated.id, updated);
    return of(updated).pipe(delay(320));
  }

  runDescriptive(payload: DescriptiveStatsRequest): Observable<DescriptiveStatsResult> {
    const dataset = this.datasets.get(payload.datasetId);
    if (!dataset) {
      return throwError(() => new Error('No hay dataset cargado en workspace.'));
    }

    const columnResults: ColumnDescriptiveStats[] = [];
    const summary: SummaryMetric[] = [];

    for (const columnKey of payload.columns) {
      const values = dataset.rows.map((row) => row[columnKey]).filter((value) => value !== null && value !== '') as Array<string | number>;
      const numeric = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));

      if (numeric.length === 0) {
        const frequencies = this.frequencyTable(values.map((value) => String(value)));
        columnResults.push({
          column: columnKey,
          percentiles: {},
          frequencies
        });
        continue;
      }

      numeric.sort((a, b) => a - b);
      const mean = numeric.reduce((acc, value) => acc + value, 0) / numeric.length;
      const variance = numeric.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / Math.max(numeric.length - 1, 1);
      const percentiles = Object.fromEntries(
        payload.percentiles.map((p) => [`p${p}`, this.quantile(numeric, p / 100)])
      );

      summary.push({ label: `Media ${columnKey}`, value: mean.toFixed(3) });

      columnResults.push({
        column: columnKey,
        mean,
        median: this.quantile(numeric, 0.5),
        mode: this.mode(numeric),
        variance,
        standardDeviation: Math.sqrt(variance),
        min: numeric[0],
        max: numeric[numeric.length - 1],
        percentiles
      });
    }

    return of({
      datasetId: payload.datasetId,
      generatedAt: new Date().toISOString(),
      summary,
      columns: columnResults
    }).pipe(delay(380));
  }

  generateChart(payload: ChartRequest): Observable<ChartResult> {
    const dataset = this.datasets.get(payload.datasetId);
    if (!dataset) {
      return throwError(() => new Error('No hay dataset cargado en workspace.'));
    }

    const xColumn = payload.xColumn ?? dataset.columns[0]?.key ?? '';
    const yColumn = payload.yColumn ?? dataset.columns[1]?.key ?? '';
    const series: ChartSeries[] = [];

    if (payload.type === 'heatmap') {
      const xBuckets = ['Q1', 'Q2', 'Q3', 'Q4'];
      const points = xBuckets.flatMap((bucket, xIndex) =>
        xBuckets.map((rowBucket, yIndex) => ({ x: `${bucket}-${rowBucket}`, y: (xIndex + 1) * (yIndex + 2) }))
      );
      series.push({ label: 'Heatmap', points });
    } else if (payload.type === 'histogram' || payload.type === 'pareto') {
      const values = dataset.rows.map((row) => Number(row[yColumn])).filter((value) => Number.isFinite(value));
      const bins = this.histogram(values, 7);
      series.push({
        label: payload.type === 'pareto' ? 'Pareto' : 'Histogram',
        points: bins.map((bin) => ({ x: bin.label, y: bin.count }))
      });
    } else {
      series.push({
        label: 'Main',
        points: dataset.rows.slice(0, 80).map((row, index) => ({
          x: this.chartXValue(row[xColumn], index),
          y: Number(row[yColumn]) || 0
        }))
      });
    }

    return of({
      id: this.createId('chart'),
      type: payload.type,
      title: payload.title ?? `Chart ${payload.type}`,
      xLabel: xColumn,
      yLabel: yColumn,
      generatedAt: new Date().toISOString(),
      series
    }).pipe(delay(320));
  }

  runModule(module: string, payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return of({
      module,
      status: 'completed',
      message: `Ejecución mock de ${module} completada.`,
      input: payload,
      generatedAt: new Date().toISOString()
    }).pipe(delay(320));
  }

  exportReport(payload: ReportRequest): Observable<ReportArtifact> {
    return of({
      id: this.createId('report'),
      format: payload.format,
      fileName: `${payload.title.toLowerCase().replace(/\s+/g, '-')}.${payload.format}`,
      createdAt: new Date().toISOString(),
      downloadUrl: '#'
    }).pipe(delay(350));
  }

  private buildDataset(payload: UploadDatasetRequest): Dataset {
    const parsed = this.parseContent(payload.content, payload.delimiter ?? ',');
    const base = parsed ?? createSeedDataset();

    const selected = payload.selectedColumns?.length
      ? new Set(payload.selectedColumns)
      : null;
    const columns = selected ? base.columns.filter((column) => selected.has(column.key)) : base.columns;
    const rows = base.rows.map((row) => {
      if (!selected) {
        return { ...row };
      }
      const filteredRow: DatasetRow = {};
      for (const column of columns) {
        filteredRow[column.key] = row[column.key] ?? null;
      }
      return filteredRow;
    });

    const rangedRows = this.applyRange(rows, payload.rowRange);
    const datasetId = this.createId('dataset');
    return {
      id: datasetId,
      name: payload.fileName.replace(/\.(xlsx|xls|csv|txt)$/i, ''),
      sourceFile: payload.fileName,
      sheetName: payload.sheetName,
      columns,
      rows: rangedRows,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private buildPreview(dataset: Dataset): DatasetPreview {
    return {
      columns: dataset.columns,
      rows: dataset.rows.slice(0, 12),
      totalColumns: dataset.columns.length,
      totalRows: dataset.rows.length
    };
  }

  private parseContent(content: string | undefined, delimiter: string): Dataset | null {
    if (!content || content.trim().length === 0) {
      return null;
    }

    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length < 2) {
      return null;
    }

    const headers = lines[0].split(delimiter).map((cell) => cell.trim());
    const rows = lines.slice(1).map((line) => {
      const cells = line.split(delimiter).map((cell) => cell.trim());
      const row: DatasetRow = {};
      headers.forEach((header, index) => {
        const value = cells[index] ?? '';
        const numeric = Number(value);
        row[this.toKey(header)] = value === '' ? null : Number.isFinite(numeric) && value !== '' ? numeric : value;
      });
      return row;
    });

    const columns: DatasetColumn[] = headers.map((header) => {
      const key = this.toKey(header);
      const values = rows.map((row) => row[key]);
      return {
        key,
        label: header,
        type: this.detectColumnType(values),
        nullable: values.some((value) => value === null)
      };
    });

    return {
      id: this.createId('dataset'),
      name: 'Imported Dataset',
      sourceFile: 'uploaded-file',
      columns,
      rows,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private detectColumnType(values: Array<string | number | boolean | null>): DatasetColumn['type'] {
    const nonNull = values.filter((value) => value !== null);
    if (nonNull.every((value) => typeof value === 'number')) {
      return 'numeric';
    }
    if (nonNull.every((value) => typeof value === 'boolean')) {
      return 'boolean';
    }
    return 'categorical';
  }

  private frequencyTable(values: string[]): Array<{ value: string; count: number }> {
    const map = new Map<string, number>();
    values.forEach((value) => map.set(value, (map.get(value) ?? 0) + 1));
    return [...map.entries()].map(([value, count]) => ({ value, count }));
  }

  private quantile(sorted: number[], q: number): number {
    if (sorted.length === 0) {
      return 0;
    }
    const index = (sorted.length - 1) * q;
    const low = Math.floor(index);
    const high = Math.ceil(index);
    if (low === high) {
      return sorted[low];
    }
    const weight = index - low;
    return sorted[low] * (1 - weight) + sorted[high] * weight;
  }

  private mode(values: number[]): number {
    const map = new Map<number, number>();
    values.forEach((value) => map.set(value, (map.get(value) ?? 0) + 1));
    let topValue = values[0] ?? 0;
    let topCount = -1;
    for (const [value, count] of map.entries()) {
      if (count > topCount) {
        topCount = count;
        topValue = value;
      }
    }
    return topValue;
  }

  private histogram(values: number[], bins: number): Array<{ label: string; count: number }> {
    if (values.length === 0) {
      return [];
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const width = (max - min || 1) / bins;
    const result = new Array<number>(bins).fill(0);
    values.forEach((value) => {
      const index = Math.min(bins - 1, Math.floor((value - min) / width));
      result[index] += 1;
    });
    return result.map((count, index) => ({
      label: `${(min + index * width).toFixed(1)}-${(min + (index + 1) * width).toFixed(1)}`,
      count
    }));
  }

  private applyRange(rows: DatasetRow[], range: string | undefined): DatasetRow[] {
    if (!range || !range.includes(':')) {
      return rows;
    }
    const [startRaw, endRaw] = range.split(':');
    const start = Math.max(1, Number(startRaw));
    const end = Math.max(start, Number(endRaw));
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return rows;
    }
    return rows.slice(start - 1, end);
  }

  private toKey(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }

  private chartXValue(value: string | number | boolean | null | undefined, index: number): string | number {
    if (typeof value === 'number' || typeof value === 'string') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return index;
  }

  private createId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
