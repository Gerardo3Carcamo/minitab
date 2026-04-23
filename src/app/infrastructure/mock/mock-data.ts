import { Dataset, DatasetColumn, DatasetRow } from '../../shared/models/dataset.model';

const seedColumns: DatasetColumn[] = [
  { key: 'batch', label: 'Batch', type: 'categorical', nullable: false },
  { key: 'operator', label: 'Operator', type: 'categorical', nullable: false },
  { key: 'temperature', label: 'Temperature', type: 'numeric', nullable: false },
  { key: 'pressure', label: 'Pressure', type: 'numeric', nullable: false },
  { key: 'defects', label: 'Defects', type: 'numeric', nullable: true },
  { key: 'timestamp', label: 'Timestamp', type: 'datetime', nullable: false }
];

const seedRows: DatasetRow[] = [
  { batch: 'B-101', operator: 'Ana', temperature: 21.7, pressure: 98.1, defects: 2, timestamp: '2026-04-01' },
  { batch: 'B-102', operator: 'Luis', temperature: 22.4, pressure: 99.6, defects: 0, timestamp: '2026-04-02' },
  { batch: 'B-103', operator: 'Ana', temperature: 23.1, pressure: 100.3, defects: 1, timestamp: '2026-04-03' },
  { batch: 'B-104', operator: 'Mia', temperature: 20.9, pressure: 97.2, defects: null, timestamp: '2026-04-04' },
  { batch: 'B-105', operator: 'Luis', temperature: 24.2, pressure: 101.8, defects: 4, timestamp: '2026-04-05' },
  { batch: 'B-106', operator: 'Mia', temperature: 21.1, pressure: 98.7, defects: 1, timestamp: '2026-04-06' },
  { batch: 'B-107', operator: 'Ana', temperature: 22.8, pressure: 100.1, defects: 0, timestamp: '2026-04-07' },
  { batch: 'B-108', operator: 'Luis', temperature: 23.6, pressure: 102.4, defects: 3, timestamp: '2026-04-08' },
  { batch: 'B-109', operator: 'Mia', temperature: 20.7, pressure: 96.5, defects: 2, timestamp: '2026-04-09' },
  { batch: 'B-110', operator: 'Ana', temperature: 21.9, pressure: 99.1, defects: 1, timestamp: '2026-04-10' }
];

export const MOCK_EXCEL_SHEETS = ['Sheet1', 'Process', 'Quality'];

export const createSeedDataset = (): Dataset => ({
  id: 'dataset-seed',
  name: 'Mock Process Dataset',
  sourceFile: 'quality-process.xlsx',
  sheetName: 'Process',
  columns: seedColumns.map((column) => ({ ...column })),
  rows: seedRows.map((row) => ({ ...row })),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
