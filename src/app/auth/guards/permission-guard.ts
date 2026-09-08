import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';
import { AuthService } from '../services/auth-service';

type PermissionMode = 'any' | 'all';

export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.loadSession().pipe(
    map((isAuth) => {
      if (!isAuth) {
        return router.parseUrl(environment.LOGIN_ROUTE);
      }

      if (!authService.hasApplicationAccess()) {
        return router.parseUrl(environment.NO_ACCESS_ROUTE);
      }

      const permissions = normalizePermissions(
        route.data?.['permissions'] ?? route.data?.['permission'],
      );

      if (permissions.length === 0) {
        return true;
      }

      const mode = normalizeMode(route.data?.['permissionMode']);
      const canActivate = mode === 'all'
        ? authService.hasAllPermissions(permissions)
        : authService.hasAnyPermission(permissions);

      return canActivate ? true : router.parseUrl(environment.HOME_ROUTE);
    }),
  );
};

function normalizePermissions(value: unknown): string[] {
  const permissions = Array.isArray(value) ? value : [value];

  return permissions
    .map((permission) => (typeof permission === 'string' ? permission.trim() : ''))
    .filter((permission) => permission.length > 0);
}

function normalizeMode(value: unknown): PermissionMode {
  return value === 'all' ? 'all' : 'any';
}
