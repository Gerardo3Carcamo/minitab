export type ColumnDataType = 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'text';

export interface DatasetColumn {
  key: string;
  label: string;
  type: ColumnDataType;
  nullable: boolean;
  hidden?: boolean;
}

export interface DatasetRow {
  [columnKey: string]: string | number | boolean | null;
}

export interface Dataset {
  id: string;
  name: string;
  sourceFile: string;
  sheetName?: string;
  columns: DatasetColumn[];
  rows: DatasetRow[];
  createdAt: string;
  updatedAt: string;
}

export type ImportStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ImportJob {
  id: string;
  fileName: string;
  fileType: 'xlsx' | 'xls' | 'csv' | 'txt';
  sheetName?: string;
  availableSheets?: string[];
  selectedColumns?: string[];
  rowRange?: string;
  progress: number;
  status: ImportStatus;
  startedAt: string;
  finishedAt?: string;
  errors: string[];
  preview?: DatasetPreview;
}

export interface DatasetPreview {
  columns: DatasetColumn[];
  rows: DatasetRow[];
  totalRows: number;
  totalColumns: number;
}

export interface UploadDatasetRequest {
  file?: File;
  fileName: string;
  fileType: 'xlsx' | 'xls' | 'csv' | 'txt';
  sheetName?: string;
  selectedColumns?: string[];
  rowRange?: string;
  delimiter?: ',' | ';' | '\t' | '|';
  content?: string;
}
