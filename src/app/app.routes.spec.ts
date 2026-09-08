import { environment } from '../environments/environment';
import { authGuard } from './auth/guards/auth-guard';
import { routes } from './app.routes';

describe('application routes', () => {
  it('registers the no-access page before the wildcard route', () => {
    const noAccessPath = environment.NO_ACCESS_ROUTE.replace(/^\//, '');
    const noAccessIndex = routes.findIndex((route) => route.path === noAccessPath);
    const wildcardIndex = routes.findIndex((route) => route.path === '**');

    expect(noAccessIndex).toBeGreaterThanOrEqual(0);
    expect(noAccessIndex).toBeLessThan(wildcardIndex);
    expect(routes[noAccessIndex].canActivate).toContain(authGuard);
  });
});
