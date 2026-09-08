import type { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { SKIP_AUTH_REFRESH } from './auth-context';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isApiRequest = req.url.startsWith(environment.API_URL);
  const isAuthRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/logout');
  const skipAuthRefresh = req.context.get(SKIP_AUTH_REFRESH);

  let authReq = req;

  if (isApiRequest) {
    const headers: Record<string, string> = {
      'X-App-Id': environment.APP_ID,
    };
    const token = authService.getToken();

    if (environment.AUTH_USE_LOCAL_STORAGE_TOKEN && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    authReq = req.clone({
      setHeaders: headers,
      withCredentials: !environment.AUTH_USE_LOCAL_STORAGE_TOKEN,
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const canTryRefresh = environment.AUTH_USE_LOCAL_STORAGE_TOKEN
        ? Boolean(authService.getToken())
        : authService.isAuthenticated();

      if (!isApiRequest || isAuthRequest || skipAuthRefresh || error.status !== 401 || !canTryRefresh) {
        return throwError(() => error);
      }

      return authService.refresh().pipe(
        switchMap(() => {
          const retryHeaders: Record<string, string> = {
            'X-App-Id': environment.APP_ID,
          };
          const token = authService.getToken();

          if (environment.AUTH_USE_LOCAL_STORAGE_TOKEN && token) {
            retryHeaders['Authorization'] = `Bearer ${token}`;
          }

          return next(
            req.clone({
              setHeaders: retryHeaders,
              withCredentials: !environment.AUTH_USE_LOCAL_STORAGE_TOKEN,
            }),
          );
        }),
        catchError((refreshError) => {
          authService.logout(false);
          router.navigateByUrl(environment.LOGIN_ROUTE);

          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
