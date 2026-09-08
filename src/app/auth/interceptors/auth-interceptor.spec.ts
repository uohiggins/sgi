import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { SKIP_AUTH_REFRESH } from './auth-context';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let authService: {
    getToken: ReturnType<typeof vi.fn>;
    isAuthenticated: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  const originalUseLocalStorageToken = environment.AUTH_USE_LOCAL_STORAGE_TOKEN;

  beforeEach(() => {
    environment.AUTH_USE_LOCAL_STORAGE_TOKEN = true;

    authService = {
      getToken: vi.fn(() => 'jwt-token'),
      isAuthenticated: vi.fn(() => false),
      refresh: vi.fn(() => of({})),
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    environment.AUTH_USE_LOCAL_STORAGE_TOKEN = originalUseLocalStorageToken;
  });

  it('adds X-App-Id and Bearer token to API requests in localStorage mode', () => {
    TestBed.inject(HttpClient).get(`${environment.API_URL}/secure`).subscribe();

    const req = httpMock.expectOne(`${environment.API_URL}/secure`);

    expect(req.request.headers.get('X-App-Id')).toBe(environment.APP_ID);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(req.request.withCredentials).toBe(false);
    req.flush({ ok: true });
  });

  it('uses HttpOnly cookie credentials when localStorage mode is disabled', () => {
    environment.AUTH_USE_LOCAL_STORAGE_TOKEN = false;
    authService.getToken.mockReturnValue(null);

    TestBed.inject(HttpClient).get(`${environment.API_URL}/secure`).subscribe();

    const req = httpMock.expectOne(`${environment.API_URL}/secure`);

    expect(req.request.headers.get('X-App-Id')).toBe(environment.APP_ID);
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ ok: true });
  });

  it('does not try refresh on 401 when cookie mode has no loaded session', () => {
    let failed = false;
    environment.AUTH_USE_LOCAL_STORAGE_TOKEN = false;
    authService.getToken.mockReturnValue(null);
    authService.isAuthenticated.mockReturnValue(false);

    TestBed.inject(HttpClient).get(`${environment.API_URL}/auth/me`).subscribe({
      error: () => {
        failed = true;
      },
    });

    const req = httpMock.expectOne(`${environment.API_URL}/auth/me`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.refresh).not.toHaveBeenCalled();
    expect(authService.logout).not.toHaveBeenCalled();
    expect(failed).toBe(true);
  });

  it('respects the skip refresh context flag on session validation requests', () => {
    let failed = false;
    authService.isAuthenticated.mockReturnValue(true);

    TestBed.inject(HttpClient)
      .get(`${environment.API_URL}/auth/me`, {
        context: new HttpContext().set(SKIP_AUTH_REFRESH, true),
      })
      .subscribe({
        error: () => {
          failed = true;
        },
      });

    const req = httpMock.expectOne(`${environment.API_URL}/auth/me`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.refresh).not.toHaveBeenCalled();
    expect(failed).toBe(true);
  });

  it('tries refresh once on an API 401 and retries the original request', () => {
    let response: unknown;

    TestBed.inject(HttpClient).get(`${environment.API_URL}/secure`).subscribe((res) => {
      response = res;
    });

    const firstReq = httpMock.expectOne(`${environment.API_URL}/secure`);
    firstReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const retryReq = httpMock.expectOne(`${environment.API_URL}/secure`);

    expect(authService.refresh).toHaveBeenCalledOnce();
    expect(retryReq.request.headers.get('X-App-Id')).toBe(environment.APP_ID);
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    retryReq.flush({ ok: true });

    expect(response).toEqual({ ok: true });
  });
});
