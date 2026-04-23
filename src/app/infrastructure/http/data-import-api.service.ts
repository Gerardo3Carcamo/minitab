import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { Dataset, ImportJob, UploadDatasetRequest } from '../../shared/models/dataset.model';
import { MockApiService } from '../mock/mock-api.service';
import { inferFileTypeFromExtension, mapBackendDataset, mapPreviewToDatasetPreview } from './backend-mappers';
import { DataImportHttpService } from './data-import.http.service';

@Injectable({ providedIn: 'root' })
export class DataImportApiService {
  private readonly settings = inject(APP_SETTINGS);
  private readonly importContext = new Map<string, { sheetName?: string; fileName: string; delimiter?: string }>();

  constructor(
    private readonly http: DataImportHttpService,
    private readonly mock: MockApiService
  ) {}

  uploadDataset(payload: UploadDatasetRequest): Observable<ImportJob> {
    if (this.settings.useMockApi) {
      return this.mock.uploadDataset(payload);
    }

    if (!payload.file) {
      throw new Error('No se recibió archivo para subir.');
    }

    return this.http.uploadFile(payload.file).pipe(
      switchMap((uploaded) => {
        const isExcel = ['.xlsx', '.xls'].includes(uploaded.extension.toLowerCase());
        const sheets$ = isExcel ? this.http.getSheets(uploaded.file_id).pipe(map((result) => result.sheets)) : of<string[]>([]);

        return sheets$.pipe(
          switchMap((sheets) => {
            const sheetName = payload.sheetName ?? sheets[0];
            const previewRows = parsePreviewRows(payload.rowRange);
            this.importContext.set(uploaded.file_id, {
              sheetName,
              fileName: uploaded.filename,
              delimiter: payload.delimiter
            });

            return this.http.previewFile({
              file_id: uploaded.file_id,
              sheet_name: sheetName,
              rows: previewRows,
              delimiter: payload.delimiter,
              has_header: true
            }).pipe(
              map((preview): ImportJob => ({
                id: uploaded.file_id,
                fileName: uploaded.filename,
                fileType: inferFileTypeFromExtension(uploaded.extension),
                sheetName,
                availableSheets: sheets,
                progress: 100,
                status: 'completed',
                startedAt: uploaded.uploaded_at,
                finishedAt: new Date().toISOString(),
                errors: [],
                preview: mapPreviewToDatasetPreview(preview)
              }))
            );
          })
        );
      })
    );
  }

  importToWorkspace(fileId: string): Observable<Dataset> {
    if (this.settings.useMockApi) {
      return this.mock.importToWorkspace(fileId);
    }

    const context = this.importContext.get(fileId);
    const datasetName = context?.fileName?.replace(/\.(xlsx|xls|csv|txt)$/i, '') ?? `dataset_${fileId.slice(0, 6)}`;

    return this.http.importDataset({
      file_id: fileId,
      dataset_name: datasetName,
      sheet_name: context?.sheetName,
      delimiter: context?.delimiter,
      has_header: true
    }).pipe(
      switchMap((datasetMetadata) =>
        this.http.getDatasetPreview(datasetMetadata.dataset_id, 250).pipe(
          map((preview) => mapBackendDataset(datasetMetadata, preview))
        )
      )
    );
  }

  getImportHistory(): Observable<ImportJob[]> {
    if (this.settings.useMockApi) {
      return this.mock.getImportHistory();
    }

    return this.http.getFiles().pipe(
      map((response) =>
        response.files.map((file) => ({
          id: file.file_id,
          fileName: file.filename,
          fileType: inferFileTypeFromExtension(file.extension),
          progress: 100,
          status: 'completed',
          startedAt: file.uploaded_at,
          finishedAt: file.uploaded_at,
          errors: []
        }))
      )
    );
  }

  getDatasetById(datasetId: string): Observable<Dataset> {
    if (this.settings.useMockApi) {
      return this.mock.getDataset(datasetId);
    }

    return forkJoin({
      meta: this.http.getDataset(datasetId),
      preview: this.http.getDatasetPreview(datasetId, 250)
    }).pipe(
      map(({ meta, preview }) => mapBackendDataset(meta, preview))
    );
  }
}

function parsePreviewRows(range: string | undefined): number {
  if (!range) {
    return 100;
  }
  const segments = range.split(':').map((value) => Number(value.trim()));
  if (segments.length !== 2 || segments.some((value) => !Number.isFinite(value))) {
    return 100;
  }
  const [start, end] = segments;
  if (end < start) {
    return 100;
  }
  return Math.max(1, Math.min(200, end - start + 1));
}
