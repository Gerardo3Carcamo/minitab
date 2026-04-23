import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ChartRequest, ChartResult, ChartSeriesPoint } from '../../shared/models/chart.model';
import { BackendChartResponse } from './backend-mappers';

@Injectable({ providedIn: 'root' })
export class VisualizationHttpService {
  constructor(private readonly http: HttpClient) {}

  generateChart(payload: ChartRequest): Observable<ChartResult> {
    const endpoint = this.endpointFor(payload);
    return this.http.get<BackendChartResponse>(endpoint.path, { params: endpoint.params }).pipe(
      map((response) => this.mapResponse(payload, response))
    );
  }

  private endpointFor(payload: ChartRequest): { path: string; params?: Record<string, string | string[]> } {
    switch (payload.type) {
      case 'histogram':
        return {
          path: `/visualizations/histogram/${payload.datasetId}/${payload.yColumn ?? payload.xColumn ?? ''}`,
          params: { bins: '12' }
        };
      case 'boxplot':
        return {
          path: `/visualizations/boxplot/${payload.datasetId}/${payload.yColumn ?? payload.xColumn ?? ''}`
        };
      case 'scatter':
        return {
          path: `/visualizations/scatter/${payload.datasetId}`,
          params: { x: payload.xColumn ?? '', y: payload.yColumn ?? '' }
        };
      case 'line':
        return {
          path: `/visualizations/line/${payload.datasetId}`,
          params: { x: payload.xColumn ?? '', y: payload.yColumn ?? '' }
        };
      case 'pareto':
        return {
          path: `/visualizations/pareto/${payload.datasetId}`,
          params: {
            category_column: payload.xColumn ?? '',
            value_column: payload.yColumn ?? ''
          }
        };
      case 'heatmap':
        return {
          path: `/visualizations/heatmap/${payload.datasetId}`,
          params: payload.xColumn && payload.yColumn ? { columns: [payload.xColumn, payload.yColumn] } : undefined
        };
    }
  }

  private mapResponse(payload: ChartRequest, response: BackendChartResponse): ChartResult {
    return {
      id: `${response.dataset_id}-${Date.now()}`,
      type: payload.type,
      title: payload.title ?? `Chart ${payload.type}`,
      xLabel: payload.xColumn ?? 'x',
      yLabel: payload.yColumn ?? 'y',
      generatedAt: new Date().toISOString(),
      series: [
        {
          label: payload.type,
          points: this.mapPoints(payload.type, response.payload, payload)
        }
      ]
    };
  }

  private mapPoints(
    type: ChartRequest['type'],
    payload: Record<string, unknown>,
    request: ChartRequest
  ): ChartSeriesPoint[] {
    if (type === 'histogram') {
      const bins = (payload['bins'] as Array<{ left: number; right: number; count: number }> | undefined) ?? [];
      return bins.map((bin) => ({
        x: `${bin.left.toFixed(2)}-${bin.right.toFixed(2)}`,
        y: bin.count
      }));
    }

    if (type === 'boxplot') {
      return [
        { x: 'lower', y: Number(payload['lower_whisker'] ?? 0) },
        { x: 'q1', y: Number(payload['q1'] ?? 0) },
        { x: 'median', y: Number(payload['median'] ?? 0) },
        { x: 'q3', y: Number(payload['q3'] ?? 0) },
        { x: 'upper', y: Number(payload['upper_whisker'] ?? 0) }
      ];
    }

    if (type === 'scatter') {
      const points = (payload['points'] as Array<Record<string, unknown>> | undefined) ?? [];
      const xKey = String(payload['x'] ?? request.xColumn ?? 'x');
      const yKey = String(payload['y'] ?? request.yColumn ?? 'y');
      return points.map((point, index) => ({
        x: typeof point[xKey] === 'number' || typeof point[xKey] === 'string' ? point[xKey] as number | string : index,
        y: Number(point[yKey] ?? 0)
      }));
    }

    if (type === 'line') {
      const points = (payload['series'] as Array<Record<string, unknown>> | undefined) ?? [];
      const xKey = String(payload['x'] ?? request.xColumn ?? 'x');
      const yKey = String(payload['y'] ?? request.yColumn ?? 'y');
      return points.map((point, index) => ({
        x: typeof point[xKey] === 'number' || typeof point[xKey] === 'string' ? point[xKey] as number | string : index,
        y: Number(point[yKey] ?? 0)
      }));
    }

    if (type === 'pareto') {
      const categories = (payload['categories'] as string[] | undefined) ?? [];
      const values = (payload['values'] as number[] | undefined) ?? [];
      return categories.map((category, index) => ({
        x: category,
        y: Number(values[index] ?? 0)
      }));
    }

    const columns = (payload['columns'] as string[] | undefined) ?? [];
    const matrix = (payload['matrix'] as number[][] | undefined) ?? [];
    const points: ChartSeriesPoint[] = [];
    matrix.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        points.push({
          x: `${columns[rowIndex] ?? rowIndex}-${columns[colIndex] ?? colIndex}`,
          y: Number(value)
        });
      });
    });
    return points;
  }
}
