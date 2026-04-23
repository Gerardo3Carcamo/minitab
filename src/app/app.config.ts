import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { APP_SETTINGS, APP_SETTINGS_VALUE } from './core/config/app-settings';
import { apiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiBaseUrlInterceptor, httpErrorInterceptor])),
    {
      provide: APP_SETTINGS,
      useValue: APP_SETTINGS_VALUE
    }
  ]
};
