import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_SETTINGS } from '../config/app-settings';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const settings = inject(APP_SETTINGS);

  if (/^https?:\/\//i.test(req.url)) {
    return next(req);
  }

  const normalizedPath = req.url.startsWith('/') ? req.url : `/${req.url}`;
  const request = req.clone({
    url: `${settings.apiBaseUrl}${normalizedPath}`
  });

  return next(request);
};
