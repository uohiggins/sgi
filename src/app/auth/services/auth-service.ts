import { HttpClient, HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

import { catchError, map, Observable, of, tap } from 'rxjs';
import Swal from 'sweetalert2/dist/sweetalert2.esm.all.js';
import { SKIP_AUTH_REFRESH } from '../interceptors/auth-context';
import { User } from '../interfaces/user';

export interface AuthApplication {
  id: number;
  uuid: string;
  name: string;
  slug?: string | null;
  url: string;
  icon?: string | null;
  color?: string | null;
  has_access?: boolean;
}

export interface AuthAccess {
  is_super_admin: boolean;
  current_application: AuthApplication | null;
  available_applications: AuthApplication[];
  roles: Array<{ id: number; name: string }>;
  permissions: string[];
  replacements: unknown[];
}

export interface AuthSession {
  token_type?: string;
  access_token?: string;
  expires_in?: number;
  user: User;
  access: AuthAccess;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = environment.API_URL;
  private readonly tokenKey = 'access_token';
  private readonly useLocalStorageToken = environment.AUTH_USE_LOCAL_STORAGE_TOKEN;

  private _user = signal<User | null>(null);
  private _access = signal<AuthAccess | null>(null);
  private _sessionLoaded = signal(false);
  private _token = signal<string | null>(
    this.useLocalStorageToken ? localStorage.getItem(this.tokenKey) : null,
  );

  public currentUser = this._user.asReadonly();
  public access = this._access.asReadonly();
  public availableApplications = computed(() => this._access()?.available_applications ?? []);
  public currentApplication = computed(() => this._access()?.current_application ?? null);
  private readonly _permissionsSet = computed(() => new Set(this._access()?.permissions ?? []));
  public appName = environment.APP_NAME;
  public isAuthenticated = computed(() =>
    this.useLocalStorageToken ? Boolean(this._token()) : Boolean(this._user()),
  );

  login(credentials: { email: string; password: string }): Observable<AuthSession | null> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, credentials).pipe(
      map((res) => this.storeSession(res)),
      catchError((err) => {
        console.error('Login error:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo iniciar sesion. Verifique sus credenciales e intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          showConfirmButton: true,
        });
        return of(null);
      }),
    );
  }

  loadSession(options: { force?: boolean; skipRefresh?: boolean } = {}): Observable<boolean> {
    if (!options.force && this._sessionLoaded() && this._user() && this._access()) {
      return of(true);
    }

    if (this.useLocalStorageToken && !this.getToken()) {
      this.clearState();
      return of(false);
    }

    const requestOptions = options.skipRefresh
      ? { context: new HttpContext().set(SKIP_AUTH_REFRESH, true) }
      : {};

    return this.http.get<any>(`${this.API_URL}/auth/me`, requestOptions).pipe(
      tap((res) => this.storeSession(res)),
      map(() => true),
      catchError(() => {
        this.clearState();
        return of(false);
      }),
    );
  }

  refresh(): Observable<AuthSession> {
    return this.http
      .post<any>(`${this.API_URL}/auth/refresh`, {})
      .pipe(map((res) => this.storeSession(res)));
  }

  logout(navigateToLogin = true): void {
    const finish = () => {
      this.clearState();

      if (navigateToLogin) {
        this.router.navigateByUrl(environment.LOGIN_ROUTE);
      }
    };

    if (!this.isAuthenticated() && !this.getToken()) {
      finish();
      return;
    }

    this.http
      .post(`${this.API_URL}/auth/logout`, {})
      .pipe(catchError(() => of(null)))
      .subscribe(() => finish());
  }

  getToken(): string | null {
    return this._token();
  }

  updateCurrentUser(patch: Partial<AuthSession['user']>): void {
    const currentUser = this._user();

    if (currentUser) {
      this._user.set({ ...currentUser, ...patch });
    }
  }

  hasApplicationAccess(application?: AuthApplication | null): boolean {
    const currentApplication = application ?? this._access()?.current_application;

    if (!currentApplication) return false;

    return this.isSuperAdmin() || Boolean(currentApplication.has_access);
  }

  isSuperAdmin(): boolean {
    return Boolean(this._access()?.is_super_admin);
  }

  hasPermission(permission: string): boolean {
    return this.isSuperAdmin() || this.permissionsSet().has(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    if (this.isSuperAdmin()) return true;

    const permissionSet = this.permissionsSet();

    return permissions.some((permission) => permissionSet.has(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    if (this.isSuperAdmin()) return true;

    const permissionSet = this.permissionsSet();

    return permissions.every((permission) => permissionSet.has(permission));
  }

  permissions(): string[] {
    return this._access()?.permissions ?? [];
  }

  permissionsSet(): Set<string> {
    return this._permissionsSet();
  }

  reloadSession(): Observable<boolean> {
    return this.loadSession({ force: true });
  }

  private storeSession(response: any): AuthSession {
    const session = (response?.data ?? response) as AuthSession;

    this._user.set(session.user ?? null);
    this._access.set(session.access ?? null);
    this._sessionLoaded.set(Boolean(session.user && session.access));

    //this.applyApplicationTheme(session.access?.current_application);

    if (this.useLocalStorageToken) {
      if (session.access_token) {
        localStorage.setItem(this.tokenKey, session.access_token);
        this._token.set(session.access_token);
      }
    } else {
      localStorage.removeItem(this.tokenKey);
      this._token.set(null);
    }

    return session;
  }

  private applyApplicationTheme(application: AuthApplication | null): void {
    if (!application?.color) {
      return;
    }

    document.documentElement.style.setProperty(
      '--bs-principal',
      application.color,
    );
  }

  private clearState(): void {
    localStorage.removeItem(this.tokenKey);
    this._token.set(null);
    this._user.set(null);
    this._access.set(null);
    this._sessionLoaded.set(false);
  }
}
