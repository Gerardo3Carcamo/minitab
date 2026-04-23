import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { ChartRequest, ChartResult } from '../../shared/models/chart.model';
import { MockApiService } from '../mock/mock-api.service';
import { VisualizationHttpService } from './visualization.http.service';

@Injectable({ providedIn: 'root' })
export class VisualizationApiService {
  private readonly settings = inject(APP_SETTINGS);

  constructor(
    private readonly http: VisualizationHttpService,
    private readonly mock: MockApiService
  ) {}

  generateChart(payload: ChartRequest): Observable<ChartResult> {
    return this.settings.useMockApi ? this.mock.generateChart(payload) : this.http.generateChart(payload);
  }
}
