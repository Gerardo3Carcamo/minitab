import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { Dataset, DatasetRow } from '../../shared/models/dataset.model';
import { MockApiService } from '../mock/mock-api.service';
import { WorkspaceHttpService } from './workspace.http.service';

@Injectable({ providedIn: 'root' })
export class WorkspaceApiService {
  private readonly settings = inject(APP_SETTINGS);

  constructor(
    private readonly http: WorkspaceHttpService,
    private readonly mock: MockApiService
  ) {}

  getDataset(datasetId: string): Observable<Dataset> {
    if (this.settings.useMockApi) {
      return this.mock.getDataset(datasetId);
    }
    return this.http.getDataset(datasetId);
  }

  updateRows(datasetId: string, rows: DatasetRow[]): Observable<Dataset> {
    if (this.settings.useMockApi) {
      return this.mock.getDataset(datasetId);
    }
    return this.http.updateRows(datasetId, rows);
  }
}
