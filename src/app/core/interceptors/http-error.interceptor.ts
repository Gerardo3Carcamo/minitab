import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

type ApiErrorDetailItem = {
  msg?: string;
  loc?: Array<string | number>;
  reason?: string;
  [key: string]: unknown;
};

interface ApiErrorPayload {
  message?: string;
  detail?: string | ApiErrorDetailItem | Array<ApiErrorDetailItem>;
  error?: {
    message?: string;
    details?: string | ApiErrorDetailItem | Array<ApiErrorDetailItem>;
  };
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const payload = error.error as ApiErrorPayload | null;
      const messageFromBackend = payload?.error?.message ?? payload?.message;
      const detail = payload?.error?.details ?? payload?.detail;
      const detailFromArray = Array.isArray(detail)
        ? detail
            .map((item) => {
              const loc = Array.isArray(item.loc) ? item.loc.join('.') : null;
              const msg = item.msg ?? null;
              if (loc && msg) {
                return `${loc}: ${msg}`;
              }
              return msg;
            })
            .filter(Boolean)
            .join(', ')
        : null;
      const detailFromObject = typeof detail === 'object' && detail !== null && !Array.isArray(detail)
        ? String(detail['reason'] ?? detail['msg'] ?? JSON.stringify(detail))
        : null;
      const detailFromString = typeof detail === 'string' ? detail : null;
      const message =
        messageFromBackend ??
        detailFromString ??
        detailFromArray ??
        detailFromObject ??
        (error.status === 0 ? 'No fue posible conectar con el backend.' : 'Error inesperado del servidor.');

      return throwError(() => new Error(message));
    })
  );
