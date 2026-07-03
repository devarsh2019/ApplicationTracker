import { Injectable } from '@angular/core';

import { AuthSession } from '../models/auth.models';

const AUTH_STORAGE_KEY = 'application_tracker_auth';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  read(): AuthSession | null {
    const raw =
      localStorage.getItem(AUTH_STORAGE_KEY) ?? sessionStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      this.clear();
      return null;
    }
  }

  write(session: AuthSession, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    otherStorage.removeItem(AUTH_STORAGE_KEY);
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }

  updateTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    const session = this.read();
    if (!session) {
      return;
    }

    const updated: AuthSession = {
      ...session,
      accessToken,
      refreshToken,
      expiresIn,
    };

    if (localStorage.getItem(AUTH_STORAGE_KEY)) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return;
    }

    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  }

  clear(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }

  getAccessToken(): string | null {
    return this.read()?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    return this.read()?.refreshToken ?? null;
  }
}
