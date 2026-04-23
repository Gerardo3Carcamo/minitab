import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  ColumnDescriptiveStats,
  DescriptiveStatsRequest,
  DescriptiveStatsResult,
  SummaryMetric
} from '../../shared/models/analysis.model';
import { BackendDescriptiveResponse } from './backend-mappers';

@Injectable({ providedIn: 'root' })
export class DescriptiveHttpService {
  constructor(private readonly http: HttpClient) {}

  runDescriptive(payload: DescriptiveStatsRequest): Observable<DescriptiveStatsResult> {
    const normalizedPercentiles = payload.percentiles
      .map((value) => (value > 1 ? value / 100 : value))
      .filter((value) => value >= 0 && value <= 1);

    return this.http.post<BackendDescriptiveResponse>('/descriptive/summary', {
      dataset_id: payload.datasetId,
      columns: payload.columns.length > 0 ? payload.columns : null,
      percentiles: normalizedPercentiles
    }).pipe(
      map((response) => this.mapResponse(response))
    );
  }

  private mapResponse(response: BackendDescriptiveResponse): DescriptiveStatsResult {
    const summary: SummaryMetric[] = [
      { label: 'Filas', value: response.result.rows },
      { label: 'Columnas', value: response.result.columns },
      { label: 'Interpretacion', value: response.interpretation }
    ];

    const columns: ColumnDescriptiveStats[] = [];

    for (const [column, values] of Object.entries(response.result.numeric_summary)) {
      columns.push({
        column,
        mean: values.mean ?? undefined,
        median: values.median ?? undefined,
        mode: values.mode ?? undefined,
        variance: values.variance ?? undefined,
        standardDeviation: values.std_dev ?? undefined,
        min: values.min ?? undefined,
        max: values.max ?? undefined,
        percentiles: Object.fromEntries(
          Object.entries(values.percentiles).map(([key, value]) => [
            `p${Math.round(Number(key) * 100)}`,
            value ?? 0
          ])
        )
      });
    }

    for (const [column, values] of Object.entries(response.result.categorical_summary)) {
      columns.push({
        column,
        percentiles: {},
        frequencies: values.frequency_table
      });
    }

    return {
      datasetId: response.dataset_id,
      generatedAt: new Date().toISOString(),
      summary,
      columns
    };
  }
}
