import { Injectable, signal } from '@angular/core';

export interface AuthSession {
  userId: string;
  email: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly _session = signal<AuthSession | null>(null);
  readonly session = this._session.asReadonly();

  setSession(session: AuthSession): void {
    this._session.set(session);
  }

  clearSession(): void {
    this._session.set(null);
  }
}
