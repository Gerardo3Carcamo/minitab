import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { CleaningActionRequest } from '../../shared/models/analysis.model';
import { Dataset } from '../../shared/models/dataset.model';
import { MockApiService } from '../mock/mock-api.service';
import { CleaningHttpService } from './cleaning.http.service';

@Injectable({ providedIn: 'root' })
export class CleaningApiService {
  private readonly settings = inject(APP_SETTINGS);

  constructor(
    private readonly http: CleaningHttpService,
    private readonly mock: MockApiService
  ) {}

  applyAction(payload: CleaningActionRequest): Observable<Dataset> {
    return this.settings.useMockApi ? this.mock.applyCleaning(payload) : this.http.applyAction(payload);
  }
}
