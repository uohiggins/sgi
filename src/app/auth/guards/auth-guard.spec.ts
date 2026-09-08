import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { environment } from '../../../environments/environment';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { authGuard } from './auth-guard';
import { publicGuard } from './public-guard';

describe('auth guards', () => {
  let authService: {
    loadSession: ReturnType<typeof vi.fn>;
    hasApplicationAccess: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    authService = {
      loadSession: vi.fn(),
      hasApplicationAccess: vi.fn(),
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

  function runAuthGuard(url: string) {
    return TestBed.runInInjectionContext(
      () => authGuard({} as any, { url } as any) as Observable<boolean | UrlTree>,
    );
  }

  function runPublicGuard() {
    return TestBed.runInInjectionContext(
      () => publicGuard({} as any, { url: environment.LOGIN_ROUTE } as any) as Observable<boolean | UrlTree>,
    );
  }

  it('sends unauthenticated users to login', async () => {
    authService.loadSession.mockReturnValue(of(false));

    const result = await firstValueFrom(runAuthGuard(environment.HOME_ROUTE));

    expect(router.serializeUrl(result as UrlTree)).toBe(environment.LOGIN_ROUTE);
  });

  it('sends authenticated users without app access to no access', async () => {
    authService.loadSession.mockReturnValue(of(true));
    authService.hasApplicationAccess.mockReturnValue(false);

    const result = await firstValueFrom(runAuthGuard(environment.HOME_ROUTE));

    expect(router.serializeUrl(result as UrlTree)).toBe(environment.NO_ACCESS_ROUTE);
  });

  it('lets authenticated users with app access enter private routes', async () => {
    authService.loadSession.mockReturnValue(of(true));
    authService.hasApplicationAccess.mockReturnValue(true);

    const result = await firstValueFrom(runAuthGuard(environment.HOME_ROUTE));

    expect(result).toBe(true);
  });

  it('moves authenticated users from login to no access when the app is not enabled', async () => {
    authService.loadSession.mockReturnValue(of(true));
    authService.hasApplicationAccess.mockReturnValue(false);

    const result = await firstValueFrom(runPublicGuard());

    expect(router.serializeUrl(result as UrlTree)).toBe(environment.NO_ACCESS_ROUTE);
  });
});
