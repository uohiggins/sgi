import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { environment } from '../../../environments/environment';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { permissionGuard } from './permission-guard';

describe('permissionGuard', () => {
  let authService: {
    loadSession: ReturnType<typeof vi.fn>;
    hasApplicationAccess: ReturnType<typeof vi.fn>;
    hasAnyPermission: ReturnType<typeof vi.fn>;
    hasAllPermissions: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    authService = {
      loadSession: vi.fn(),
      hasApplicationAccess: vi.fn(),
      hasAnyPermission: vi.fn(),
      hasAllPermissions: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  function runGuard(data: Record<string, unknown> = {}) {
    return TestBed.runInInjectionContext(
      () => permissionGuard({ data } as any, { url: '/secure' } as any) as Observable<boolean | UrlTree>,
    );
  }

  it('sends unauthenticated users to login', async () => {
    authService.loadSession.mockReturnValue(of(false));

    const result = await firstValueFrom(runGuard({ permissions: ['intranet.users.view'] }));

    expect(router.serializeUrl(result as UrlTree)).toBe(environment.LOGIN_ROUTE);
  });

  it('sends authenticated users without application access to no access', async () => {
    authService.loadSession.mockReturnValue(of(true));
    authService.hasApplicationAccess.mockReturnValue(false);

    const result = await firstValueFrom(runGuard({ permissions: ['intranet.users.view'] }));

    expect(router.serializeUrl(result as UrlTree)).toBe(environment.NO_ACCESS_ROUTE);
  });

  it('allows routes when the user has any listed permission', async () => {
    authService.loadSession.mockReturnValue(of(true));
    authService.hasApplicationAccess.mockReturnValue(true);
    authService.hasAnyPermission.mockReturnValue(true);

    const result = await firstValueFrom(
      runGuard({ permissions: ['intranet.users.view', 'intranet.users.manage'] }),
    );

    expect(result).toBe(true);
    expect(authService.hasAnyPermission).toHaveBeenCalledWith([
      'intranet.users.view',
      'intranet.users.manage',
    ]);
  });

  it('requires all listed permissions when permissionMode is all', async () => {
    authService.loadSession.mockReturnValue(of(true));
    authService.hasApplicationAccess.mockReturnValue(true);
    authService.hasAllPermissions.mockReturnValue(true);

    const result = await firstValueFrom(
      runGuard({
        permissions: ['intranet.roles.view', 'intranet.permissions.view'],
        permissionMode: 'all',
      }),
    );

    expect(result).toBe(true);
    expect(authService.hasAllPermissions).toHaveBeenCalledWith([
      'intranet.roles.view',
      'intranet.permissions.view',
    ]);
  });

  it('sends authenticated users without permission to the home route', async () => {
    authService.loadSession.mockReturnValue(of(true));
    authService.hasApplicationAccess.mockReturnValue(true);
    authService.hasAnyPermission.mockReturnValue(false);

    const result = await firstValueFrom(runGuard({ permissions: ['intranet.users.view'] }));

    expect(router.serializeUrl(result as UrlTree)).toBe(environment.HOME_ROUTE);
  });
});
