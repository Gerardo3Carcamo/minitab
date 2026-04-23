import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { CleaningActionRequest } from '../../shared/models/analysis.model';
import { Dataset } from '../../shared/models/dataset.model';
import { mapBackendDataset } from './backend-mappers';
import { DataImportHttpService } from './data-import.http.service';

@Injectable({ providedIn: 'root' })
export class CleaningHttpService {
  constructor(
    private readonly http: HttpClient,
    private readonly datasetsHttp: DataImportHttpService
  ) {}

  applyAction(payload: CleaningActionRequest): Observable<Dataset> {
    const request$ = this.executeAction(payload);

    return request$.pipe(
      switchMap(() =>
        this.datasetsHttp.getDataset(payload.datasetId).pipe(
          switchMap((metadata) =>
            this.datasetsHttp.getDatasetPreview(payload.datasetId, 250).pipe(
              map((preview) => mapBackendDataset(metadata, preview))
            )
          )
        )
      )
    );
  }

  private executeAction(payload: CleaningActionRequest): Observable<unknown> {
    switch (payload.action) {
      case 'replace-values':
        return this.http.post('/datasets/cleaning/replace', {
          dataset_id: payload.datasetId,
          column: payload.payload['column'],
          old_value: payload.payload['search'],
          new_value: payload.payload['replace']
        });
      case 'drop-rows':
        return this.http.post('/datasets/cleaning/drop-nulls', {
          dataset_id: payload.datasetId,
          columns: payload.payload['columns'] ?? null
        });
      case 'handle-missing': {
        const strategy = String(payload.payload['strategy'] ?? 'drop-rows');
        if (strategy === 'drop-rows') {
          return this.http.post('/datasets/cleaning/drop-nulls', {
            dataset_id: payload.datasetId,
            columns: payload.payload['column'] ? [payload.payload['column']] : null
          });
        }
        return this.http.post('/datasets/cleaning/impute', {
          dataset_id: payload.datasetId,
          column: payload.payload['column'],
          strategy: 'constant',
          constant_value: payload.payload['value']
        });
      }
      case 'mark-outliers':
        return this.http.post('/datasets/transform/outliers', {
          dataset_id: payload.datasetId,
          column: payload.payload['column'],
          method: 'zscore',
          z_threshold: payload.payload['threshold'] ?? 3
        });
      case 'transform':
        return this.http.post('/datasets/transform/scale', {
          dataset_id: payload.datasetId,
          column: payload.payload['column'],
          transform: normalizeTransform(String(payload.payload['kind'] ?? 'log'))
        });
      case 'create-derived-column':
        return this.http.post('/datasets/transform/calculated-column', {
          dataset_id: payload.datasetId,
          new_column: payload.payload['newColumn'],
          expression: payload.payload['expression']
        });
      case 'encode-categorical':
        return this.http.post('/datasets/transform/encode', {
          dataset_id: payload.datasetId,
          column: payload.payload['column'],
          method: payload.payload['method'] ?? 'onehot'
        });
      case 'convert-type':
        return this.http.post('/datasets/transform/convert-type', {
          dataset_id: payload.datasetId,
          column: payload.payload['column'],
          target_type: payload.payload['targetType']
        });
      case 'normalize-column-names':
        return this.http.post('/datasets/transform/rename-columns', {
          dataset_id: payload.datasetId,
          rename_map: payload.payload['renameMap'] ?? {}
        });
      default:
        throw new Error(`Accion no soportada por backend: ${payload.action}`);
    }
  }
}

function normalizeTransform(kind: string): 'log' | 'sqrt' | 'boxcox' {
  if (kind === 'sqrt') {
    return 'sqrt';
  }
  if (kind === 'box-cox' || kind === 'boxcox') {
    return 'boxcox';
  }
  return 'log';
}
