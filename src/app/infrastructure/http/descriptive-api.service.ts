import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { DescriptiveStatsRequest, DescriptiveStatsResult } from '../../shared/models/analysis.model';
import { MockApiService } from '../mock/mock-api.service';
import { DescriptiveHttpService } from './descriptive.http.service';

@Injectable({ providedIn: 'root' })
export class DescriptiveApiService {
  private readonly settings = inject(APP_SETTINGS);

  constructor(
    private readonly http: DescriptiveHttpService,
    private readonly mock: MockApiService
  ) {}

  runDescriptive(payload: DescriptiveStatsRequest): Observable<DescriptiveStatsResult> {
    return this.settings.useMockApi ? this.mock.runDescriptive(payload) : this.http.runDescriptive(payload);
  }
}
