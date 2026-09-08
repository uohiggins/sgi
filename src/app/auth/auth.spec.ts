import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import Auth from './auth';
import { AuthService } from './services/auth-service';

describe('Auth', () => {
  let authService: {
    login: ReturnType<typeof vi.fn>;
    loadSession: ReturnType<typeof vi.fn>;
    hasApplicationAccess: ReturnType<typeof vi.fn>;
  };
  const originalUseLocalStorageToken = environment.AUTH_USE_LOCAL_STORAGE_TOKEN;

  beforeEach(async () => {
    environment.AUTH_USE_LOCAL_STORAGE_TOKEN = true;
    authService = {
      login: vi.fn(() => of(null)),
      loadSession: vi.fn(() => of(false)),
      hasApplicationAccess: vi.fn(() => false),
    };

    await TestBed.configureTestingModule({
      imports: [Auth],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    environment.AUTH_USE_LOCAL_STORAGE_TOKEN = originalUseLocalStorageToken;
    vi.restoreAllMocks();
  });

  it('shows the configured application name on login', () => {
    const fixture = TestBed.createComponent(Auth);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(environment.APP_NAME);
  });

  it('shows AUTH-C001 when cookie mode cannot validate the session after login', () => {
    environment.AUTH_USE_LOCAL_STORAGE_TOKEN = false;
    authService.login.mockReturnValue(
      of({
        user: { id: 1, email: 'usuario@uoh.cl' },
        access: {
          is_super_admin: false,
          current_application: null,
          available_applications: [],
          roles: [],
          permissions: [],
          replacements: [],
        },
      }),
    );
    authService.loadSession.mockReturnValue(of(false));
    const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');
    const fixture = TestBed.createComponent(Auth);
    const component = fixture.componentInstance;

    component.userForm.setValue({
      email: 'usuario@uoh.cl',
      password: 'secret',
    });
    component.onSubmit();

    expect(authService.loadSession).toHaveBeenCalledWith({ skipRefresh: true });
    expect(swalSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'No se pudo completar el inicio de sesion',
        text: 'Codigo de error: AUTH-C001',
        icon: 'error',
      }),
    );
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
