import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthSessionService } from './auth-session.service';

// Placeholder guard for future authentication integration.
export const authGuard: CanActivateFn = () => {
  const sessionService = inject(AuthSessionService);
  return sessionService.session() !== null || true;
};
