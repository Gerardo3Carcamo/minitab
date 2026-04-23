import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Dataset, DatasetRow } from '../../shared/models/dataset.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceHttpService {
  constructor(private readonly http: HttpClient) {}

  getDataset(datasetId: string): Observable<Dataset> {
    return this.http.get<Dataset>(`/workspace/datasets/${datasetId}`);
  }

  updateRows(datasetId: string, rows: DatasetRow[]): Observable<Dataset> {
    return this.http.put<Dataset>(`/workspace/datasets/${datasetId}/rows`, { rows });
  }

  renameColumn(datasetId: string, columnKey: string, label: string): Observable<Dataset> {
    return this.http.patch<Dataset>(`/workspace/datasets/${datasetId}/columns/${columnKey}`, { label });
  }
}
