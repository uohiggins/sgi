import { TestBed } from '@angular/core/testing';
import { AuthService } from '../services/auth-service';
import NoAccess from './no-access';

describe('NoAccess', () => {
  let authService: {
    currentApplication: ReturnType<typeof vi.fn>;
    availableApplications: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      currentApplication: vi.fn(() => null),
      availableApplications: vi.fn(() => []),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NoAccess],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compileComponents();
  });

  it('explains that the configured application is not registered and allows logout', () => {
    const fixture = TestBed.createComponent(NoAccess);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const logoutButton = element.querySelector<HTMLButtonElement>('.actions button');

    expect(element.textContent).toContain('La aplicación no está registrada en la intranet');
    expect(logoutButton?.textContent).toContain('Cerrar sesión');

    logoutButton?.click();

    expect(authService.logout).toHaveBeenCalledOnce();
  });

  it('keeps the permission message when the application exists', () => {
    authService.currentApplication.mockReturnValue({
      id: 1,
      uuid: 'registered-app',
      name: 'Aplicación registrada',
      url: 'https://app.example.test',
      has_access: false,
    });
    const fixture = TestBed.createComponent(NoAccess);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sin acceso a Aplicación registrada');
    expect(fixture.nativeElement.textContent).toContain('no tiene permisos');
  });
});
