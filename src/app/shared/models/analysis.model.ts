export interface AnalysisOption {
  key: string;
  label: string;
  value: string | number | boolean;
}

export interface AnalysisExecution {
  id: string;
  module: string;
  analysisType: string;
  datasetId: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'completed' | 'failed';
}

export interface SummaryMetric {
  label: string;
  value: number | string;
}

export interface DescriptiveStatsRequest {
  datasetId: string;
  columns: string[];
  percentiles: number[];
}

export interface ColumnDescriptiveStats {
  column: string;
  mean?: number;
  median?: number;
  mode?: string | number;
  variance?: number;
  standardDeviation?: number;
  min?: number;
  max?: number;
  percentiles: Record<string, number>;
  frequencies?: Array<{ value: string; count: number }>;
}

export interface DescriptiveStatsResult {
  datasetId: string;
  generatedAt: string;
  summary: SummaryMetric[];
  columns: ColumnDescriptiveStats[];
}

export interface CleaningActionRequest {
  datasetId: string;
  action:
    | 'replace-values'
    | 'drop-rows'
    | 'drop-columns'
    | 'handle-missing'
    | 'mark-outliers'
    | 'transform'
    | 'create-derived-column'
    | 'encode-categorical'
    | 'convert-type'
    | 'normalize-column-names';
  payload: Record<string, unknown>;
}
