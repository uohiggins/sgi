import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthAccess, AuthService, AuthSession } from './auth-service';

describe('AuthService', () => {
  const originalUseLocalStorageToken = environment.AUTH_USE_LOCAL_STORAGE_TOKEN;

  function makeAccess(hasAccess = true, permissions: string[] = ['app.basic_access']): AuthAccess {
    return {
      is_super_admin: false,
      current_application: {
        id: 1,
        uuid: environment.APP_ID,
        name: environment.APP_NAME,
        slug: 'app',
        url: 'https://app.example.test',
        has_access: hasAccess,
      },
      available_applications: [
        {
          id: 1,
          uuid: environment.APP_ID,
          name: environment.APP_NAME,
          slug: 'app',
          url: 'https://app.example.test',
        },
      ],
      roles: [{ id: 1, name: 'Usuario' }],
      permissions,
      replacements: [],
    };
  }

  function makeSession(access: AuthAccess = makeAccess()): AuthSession {
    return {
      token_type: 'Bearer',
      access_token: 'jwt-token',
      expires_in: 3600,
      user: {
        id: 1,
        name: 'Usuario',
        last_name: 'Prueba',
        full_name: 'Usuario Prueba',
        email: 'usuario@example.test',
      },
      access,
    };
  }

  function setup(useLocalStorageToken = true) {
    environment.AUTH_USE_LOCAL_STORAGE_TOKEN = useLocalStorageToken;

    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    return {
      service: TestBed.inject(AuthService),
      httpMock: TestBed.inject(HttpTestingController),
    };
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.clear();
    environment.AUTH_USE_LOCAL_STORAGE_TOKEN = originalUseLocalStorageToken;
    TestBed.resetTestingModule();
    document.documentElement.style.removeProperty('--bs-principal');
  });

  it('stores the token and builds permission helpers in localStorage mode', () => {
    const { service, httpMock } = setup(true);
    let session: AuthSession | null | undefined;

    service.login({ email: 'usuario@uoh.cl', password: 'secret' }).subscribe((res) => {
      session = res;
    });

    const req = httpMock.expectOne(`${environment.API_URL}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: makeSession() });

    expect(session).toBeDefined();
    expect(session).not.toBeNull();
    expect((session as AuthSession).access.current_application?.has_access).toBe(true);
    expect(localStorage.getItem('access_token')).toBe('jwt-token');
    expect(service.getToken()).toBe('jwt-token');
    expect(service.hasApplicationAccess()).toBe(true);
    expect(service.hasPermission('app.basic_access')).toBe(true);
    expect(service.hasAnyPermission(['app.roles.manage', 'app.basic_access'])).toBe(true);
    expect(service.hasAllPermissions(['app.basic_access'])).toBe(true);
  });

  it('keeps the same permissions Set instance until access changes', () => {
    const { service, httpMock } = setup(true);

    service.login({ email: 'usuario@uoh.cl', password: 'secret' }).subscribe();

    const loginReq = httpMock.expectOne(`${environment.API_URL}/auth/login`);
    loginReq.flush({ data: makeSession(makeAccess(true, ['app.basic_access'])) });

    const firstSet = service.permissionsSet();
    const secondSet = service.permissionsSet();

    expect(secondSet).toBe(firstSet);
    expect(firstSet.has('app.basic_access')).toBe(true);

    service.refresh().subscribe();

    const refreshReq = httpMock.expectOne(`${environment.API_URL}/auth/refresh`);
    refreshReq.flush({ data: makeSession(makeAccess(true, ['app.roles.view'])) });

    const updatedSet = service.permissionsSet();

    expect(updatedSet).not.toBe(firstSet);
    expect(updatedSet.has('app.basic_access')).toBe(false);
    expect(updatedSet.has('app.roles.view')).toBe(true);
  });

  it('does not keep the token in localStorage when cookie mode is configured', () => {
    const { service, httpMock } = setup(false);

    service.login({ email: 'usuario@uoh.cl', password: 'secret' }).subscribe();

    const req = httpMock.expectOne(`${environment.API_URL}/auth/login`);
    req.flush({ data: makeSession() });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(service.getToken()).toBeNull();
    expect(service.hasApplicationAccess()).toBe(true);
  });

  it('loads the session once and reloads it only when explicitly requested', () => {
    localStorage.setItem('access_token', 'existing-token');
    const { service, httpMock } = setup(true);

    service.loadSession().subscribe();

    const firstRequest = httpMock.expectOne(`${environment.API_URL}/auth/me`);
    firstRequest.flush({ data: makeSession() });

    service.loadSession().subscribe((loaded) => expect(loaded).toBe(true));
    httpMock.expectNone(`${environment.API_URL}/auth/me`);

    service.reloadSession().subscribe();

    const reloadRequest = httpMock.expectOne(`${environment.API_URL}/auth/me`);
    reloadRequest.flush({ data: makeSession(makeAccess(true, ['app.roles.view'])) });

    expect(service.hasPermission('app.roles.view')).toBe(true);
  });

  it('marks the session as authenticated but without access when backend returns has_access false', () => {
    const { service, httpMock } = setup(true);

    service.login({ email: 'usuario@uoh.cl', password: 'secret' }).subscribe();

    const req = httpMock.expectOne(`${environment.API_URL}/auth/login`);
    req.flush({ data: makeSession(makeAccess(false, [])) });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.hasApplicationAccess()).toBe(false);
    expect(service.permissions()).toEqual([]);
  });

  it('does not grant a super admin access when the configured application does not exist', () => {
    const { service, httpMock } = setup(true);
    const access: AuthAccess = {
      ...makeAccess(),
      is_super_admin: true,
      current_application: null,
      roles: [],
      permissions: [],
    };

    service.login({ email: 'admin@uoh.cl', password: 'secret' }).subscribe();

    const req = httpMock.expectOne(`${environment.API_URL}/auth/login`);
    req.flush({ data: makeSession(access) });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.isSuperAdmin()).toBe(true);
    expect(service.currentApplication()).toBeNull();
    expect(service.hasApplicationAccess()).toBe(false);
  });

  it('applies --bs-principal CSS variable when login or loadSession returns current_application with a valid color', () => {
    localStorage.setItem('access_token', 'existing-token');
    const { service, httpMock } = setup(true);
    const accessWithColor: AuthAccess = {
      ...makeAccess(),
      current_application: {
        id: 1,
        uuid: environment.APP_ID,
        name: environment.APP_NAME,
        slug: 'intranet',
        url: 'https://app.uoh.cl/intranet',
        icon: 'fa-solid fa-house-laptop',
        color: '#0075C9',
        has_access: true,
      },
    };

    service.loadSession().subscribe();
    const meReq = httpMock.expectOne(`${environment.API_URL}/auth/me`);
    meReq.flush({ data: makeSession(accessWithColor) });

    expect(document.documentElement.style.getPropertyValue('--bs-principal')).toBe('#0075C9');

    document.documentElement.style.removeProperty('--bs-principal');

    service.login({ email: 'sgi.dev@uoh.test', password: 'secret' }).subscribe();
    const loginReq = httpMock.expectOne(`${environment.API_URL}/auth/login`);
    loginReq.flush({
      data: makeSession({
        ...accessWithColor,
        current_application: {
          ...accessWithColor.current_application!,
          color: '#e0ce4d',
        },
      }),
    });

    expect(document.documentElement.style.getPropertyValue('--bs-principal')).toBe('#e0ce4d');
  });
});
