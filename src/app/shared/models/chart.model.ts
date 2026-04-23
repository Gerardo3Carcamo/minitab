export type ChartType = 'histogram' | 'boxplot' | 'scatter' | 'line' | 'pareto' | 'heatmap';

export interface ChartRequest {
  datasetId: string;
  type: ChartType;
  xColumn?: string;
  yColumn?: string;
  title?: string;
  subtitle?: string;
}

export interface ChartSeriesPoint {
  x: number | string;
  y: number;
}

export interface ChartSeries {
  label: string;
  points: ChartSeriesPoint[];
}

export interface ChartResult {
  id: string;
  type: ChartType;
  title: string;
  xLabel: string;
  yLabel: string;
  series: ChartSeries[];
  generatedAt: string;
}
