import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../../features/auth/services/auth.service';
import { TokenStorageService } from '../../features/auth/services/token-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

  const accessToken = tokenStorage.getAccessToken();
  const authReq = accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
        return throwError(() => error);
      }

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken || req.url.includes('/auth/refresh')) {
        tokenStorage.clear();
        return throwError(() => error);
      }

      return authService.refresh(refreshToken).pipe(
        switchMap((tokens) => {
          tokenStorage.updateTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
          return next(
            req.clone({ setHeaders: { Authorization: `Bearer ${tokens.accessToken}` } }),
          );
        }),
        catchError((refreshError) => {
          tokenStorage.clear();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
