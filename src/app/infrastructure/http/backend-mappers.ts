import { Dataset, DatasetColumn, DatasetPreview, ImportJob } from '../../shared/models/dataset.model';

export interface BackendUploadedFile {
  file_id: string;
  filename: string;
  extension: string;
  uploaded_at: string;
}

export interface BackendFileListResponse {
  files: BackendUploadedFile[];
}

export interface BackendDatasetColumn {
  name: string;
  dtype: string;
}

export interface BackendDatasetResponse {
  dataset_id: string;
  name: string;
  rows: number;
  columns: BackendDatasetColumn[];
  source_file_id?: string | null;
  sheet_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendDatasetListResponse {
  datasets: BackendDatasetResponse[];
}

export interface BackendDatasetPreviewResponse {
  columns: string[];
  rows: Array<Record<string, string | number | boolean | null>>;
  total_rows: number;
}

export interface BackendDescriptiveResponse {
  analysis_type: string;
  dataset_id: string;
  result: {
    dataset_id: string;
    rows: number;
    columns: number;
    numeric_summary: Record<string, {
      mean: number | null;
      median: number | null;
      mode: number | null;
      variance: number | null;
      std_dev: number | null;
      range: number | null;
      min: number | null;
      max: number | null;
      percentiles: Record<string, number | null>;
    }>;
    categorical_summary: Record<string, {
      unique: number;
      top: string | null;
      top_freq: number;
      frequency_table: Array<{ value: string; count: number }>;
    }>;
  };
  interpretation: string;
}

export interface BackendChartResponse {
  dataset_id: string;
  chart_type: string;
  payload: Record<string, unknown>;
}

export interface BackendOperationResponse {
  dataset_id: string;
  operation: string;
  message: string;
  details: Record<string, unknown>;
}

export const inferFileTypeFromExtension = (extension: string): ImportJob['fileType'] => {
  const normalized = extension.toLowerCase().replace('.', '');
  if (normalized === 'xlsx' || normalized === 'xls' || normalized === 'txt') {
    return normalized;
  }
  return 'csv';
};

export const mapBackendDtype = (dtype: string): DatasetColumn['type'] => {
  const normalized = dtype.toLowerCase();
  if (normalized.includes('int') || normalized.includes('float') || normalized.includes('double')) {
    return 'numeric';
  }
  if (normalized.includes('date') || normalized.includes('time')) {
    return 'datetime';
  }
  if (normalized.includes('bool')) {
    return 'boolean';
  }
  if (normalized.includes('category') || normalized.includes('object') || normalized.includes('string')) {
    return 'categorical';
  }
  return 'text';
};

export const mapPreviewToDatasetPreview = (
  preview: BackendDatasetPreviewResponse,
  columnsInfo?: BackendDatasetColumn[]
): DatasetPreview => {
  const columns = preview.columns.map((name) => {
    const backendColumn = columnsInfo?.find((item) => item.name === name);
    return {
      key: name,
      label: name,
      type: backendColumn ? mapBackendDtype(backendColumn.dtype) : inferTypeFromSample(preview.rows, name),
      nullable: preview.rows.some((row) => row[name] === null || row[name] === '')
    };
  });

  return {
    columns,
    rows: preview.rows.map((row) => ({ ...row })),
    totalRows: preview.total_rows,
    totalColumns: preview.columns.length
  };
};

export const mapBackendDataset = (
  metadata: BackendDatasetResponse,
  preview: BackendDatasetPreviewResponse
): Dataset => {
  const previewMapped = mapPreviewToDatasetPreview(preview, metadata.columns);
  return {
    id: metadata.dataset_id,
    name: metadata.name,
    sourceFile: metadata.source_file_id ?? metadata.name,
    sheetName: metadata.sheet_name ?? undefined,
    columns: previewMapped.columns,
    rows: previewMapped.rows,
    createdAt: metadata.created_at,
    updatedAt: metadata.updated_at
  };
};

const inferTypeFromSample = (
  rows: Array<Record<string, string | number | boolean | null>>,
  column: string
): DatasetColumn['type'] => {
  const values = rows
    .map((row) => row[column])
    .filter((value) => value !== null && value !== '');
  if (values.length === 0) {
    return 'text';
  }
  if (values.every((value) => typeof value === 'number')) {
    return 'numeric';
  }
  if (values.every((value) => typeof value === 'boolean')) {
    return 'boolean';
  }
  return 'categorical';
};
