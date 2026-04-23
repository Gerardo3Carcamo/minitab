import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

interface ApiErrorPayload {
  message?: string;
  detail?: string | { reason?: string; [key: string]: unknown } | Array<{ msg?: string }>;
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const payload = error.error as ApiErrorPayload | null;
      const detailFromArray = Array.isArray(payload?.detail)
        ? payload?.detail.map((item) => item.msg).filter(Boolean).join(', ')
        : null;
      const detailFromObject = typeof payload?.detail === 'object' && payload?.detail !== null && !Array.isArray(payload.detail)
        ? String(payload.detail['reason'] ?? JSON.stringify(payload.detail))
        : null;
      const detailFromString = typeof payload?.detail === 'string' ? payload.detail : null;
      const message =
        payload?.message ??
        detailFromString ??
        detailFromArray ??
        detailFromObject ??
        (error.status === 0 ? 'No fue posible conectar con el backend.' : 'Error inesperado del servidor.');

      return throwError(() => new Error(message));
    })
  );
