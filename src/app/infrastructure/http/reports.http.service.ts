import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReportArtifact, ReportRequest } from '../../shared/models/report.model';
import { BackendOperationResponse } from './backend-mappers';

@Injectable({ providedIn: 'root' })
export class ReportsHttpService {
  constructor(private readonly http: HttpClient) {}

  exportReport(payload: ReportRequest): Observable<ReportArtifact> {
    const endpoint = payload.format === 'pdf' ? '/exports/pdf' : '/exports/excel';
    return this.http.post<BackendOperationResponse>(endpoint, {
      dataset_id: payload.datasetId,
      include_summary: payload.sections.some((section) => section.id === 'summary' && section.enabled)
    }).pipe(
      map((response) => {
        const path = String(response.details['path'] ?? '');
        const fileName = path.includes('/') ? path.split('/').at(-1) ?? path : path.split('\\').at(-1) ?? path;
        return {
          id: `${response.operation}-${Date.now()}`,
          format: payload.format,
          fileName,
          createdAt: new Date().toISOString(),
          downloadUrl: path
        };
      })
    );
  }
}
