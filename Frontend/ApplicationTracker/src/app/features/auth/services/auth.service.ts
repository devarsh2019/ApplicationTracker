import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ApiError,
  AuthResponse,
  AuthSession,
  AuthUser,
  LoginCredentials,
  MessageResponse,
  RegisterCredentials,
  TokenResponse,
} from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  register(credentials: RegisterCredentials): Observable<AuthSession> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, {
        fullName: credentials.fullName,
        email: credentials.email,
        password: credentials.password,
        acceptTerms: credentials.acceptTerms,
      })
      .pipe(
        map((response) => this.toSession(response)),
        tap((session) => this.tokenStorage.write(session, false)),
        catchError((error) => throwError(() => this.toError(error))),
      );
  }

  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, {
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe,
      })
      .pipe(
        map((response) => this.toSession(response)),
        tap((session) => this.tokenStorage.write(session, credentials.rememberMe)),
        catchError((error) => throwError(() => this.toError(error))),
      );
  }

  refresh(refreshToken: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.baseUrl}/refresh`, { refreshToken });
  }

  logout(): Observable<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();

    if (!refreshToken) {
      this.tokenStorage.clear();
      return of(undefined);
    }

    return this.http.post<void>(`${this.baseUrl}/logout`, { refreshToken }).pipe(
      tap(() => this.tokenStorage.clear()),
      catchError(() => {
        this.tokenStorage.clear();
        return of(undefined);
      }),
    );
  }

  getCurrentUser(): AuthUser | null {
    return this.tokenStorage.read()?.user ?? null;
  }

  isAuthenticated(): boolean {
    return this.tokenStorage.getAccessToken() !== null;
  }

  forgotPassword(email: string, newPassword: string): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/forgot-password`, { email, newPassword })
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  private toSession(response: AuthResponse): AuthSession {
    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn,
      user: response.user,
    };
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Please check your connection and try again.');
      }

      const apiError = error.error as ApiError | null;

      if (apiError?.errors) {
        const firstFieldError = Object.values(apiError.errors)[0];
        if (firstFieldError) {
          return new Error(firstFieldError);
        }
      }

      return new Error(apiError?.message ?? 'Something went wrong. Please try again.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Something went wrong. Please try again.');
  }
}
