import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const targetUrl = state.url.split('?')[0];

  return authService.loadSession().pipe(
    map((isAuth) => {
      if (!isAuth) {
        return router.parseUrl(environment.LOGIN_ROUTE);
      }

      if (targetUrl === environment.NO_ACCESS_ROUTE) {
        return authService.hasApplicationAccess()
          ? router.parseUrl(environment.HOME_ROUTE)
          : true;
      }

      return authService.hasApplicationAccess()
        ? true
        : router.parseUrl(environment.NO_ACCESS_ROUTE);
    }),
  );
};
