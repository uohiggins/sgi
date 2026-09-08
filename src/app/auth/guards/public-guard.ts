import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.loadSession().pipe(
    map((isAuth) => {
      if (!isAuth) {
        return true;
      }

      return authService.hasApplicationAccess()
        ? router.parseUrl(environment.HOME_ROUTE)
        : router.parseUrl(environment.NO_ACCESS_ROUTE);
    }),
  );
};
