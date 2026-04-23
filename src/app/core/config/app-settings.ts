import { InjectionToken } from '@angular/core';

export interface AppSettings {
  apiBaseUrl: string;
  useMockApi: boolean;
}

export const APP_SETTINGS = new InjectionToken<AppSettings>('APP_SETTINGS');

export const APP_SETTINGS_VALUE: AppSettings = {
  apiBaseUrl: 'http://localhost:8000/api/v1',
  useMockApi: false
};
