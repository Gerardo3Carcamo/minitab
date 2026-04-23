import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { ReportArtifact, ReportRequest } from '../../shared/models/report.model';
import { MockApiService } from '../mock/mock-api.service';
import { ReportsHttpService } from './reports.http.service';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly settings = inject(APP_SETTINGS);

  constructor(
    private readonly http: ReportsHttpService,
    private readonly mock: MockApiService
  ) {}

  export(payload: ReportRequest): Observable<ReportArtifact> {
    return this.settings.useMockApi ? this.mock.exportReport(payload) : this.http.exportReport(payload);
  }
}
