import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from '../../auth/services/auth-service';
import MainLayout from './main-layout';

describe('MainLayout (uoh-ui UohHeader + UohSidebar integration)', () => {
  let fixture: ComponentFixture<MainLayout>;
  let component: MainLayout;
  let mockAuthService: {
    currentUser: ReturnType<typeof signal>;
    currentApplication: ReturnType<typeof signal>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockAuthService = {
      currentUser: signal({
        id: 1,
        name: 'Juan',
        last_name: 'Pérez',
        email: 'juan.perez@uoh.cl',
      }),
      currentApplication: signal({
        id: 5,
        uuid: '6f3d6f67-7a1b-4d76-90b1-5dfc53fbf1a7',
        name: 'Sistema de Gestión de Infraestructura',
        url: 'http://dev.app.uoh.cl:4100',
      }),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render uoh-sidebar and uoh-header synchronized via offcanvasId', () => {
    const el: HTMLElement = fixture.nativeElement;
    const sidebarOffcanvas = el.querySelector(`#${component.offcanvasId}`);
    const headerToggleBtn = el.querySelector(
      `uoh-header button[data-bs-target="#${component.offcanvasId}"]`,
    );
    const sidebarTitle = el.querySelector('uoh-sidebar .aside-header h3');

    expect(sidebarOffcanvas).toBeTruthy();
    expect(headerToggleBtn).toBeTruthy();
    expect(sidebarTitle?.textContent?.trim()).toBe('Sistema de Gestión de Infraestructura');
  });

  it('should render navigation items in uoh-sidebar and emit logout from uoh-header', () => {
    const el: HTMLElement = fixture.nativeElement;
    const navLinks = Array.from(el.querySelectorAll('uoh-sidebar .sidebar-desktop nav a')).map(
      (a) => a.textContent?.trim(),
    );

    expect(navLinks).toEqual(['Inicio', 'Mantenedor de Proyectos']);

    const logoutLink = el.querySelector('uoh-header a.logout') as HTMLAnchorElement;
    expect(logoutLink).toBeTruthy();
    logoutLink.click();

    expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
  });
});
