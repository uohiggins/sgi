import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../services/auth-service';
import { UohHasPermissionDirective, PermissionMode } from './uoh-has-permission-directive';

@Component({
  imports: [UohHasPermissionDirective],
  template: `
    <span class="single" *uohHasPermission="'intranet.users.view'">single</span>
    <span class="multi" *uohHasPermission="permissions; mode: mode">multi</span>
  `,
})
class HostComponent {
  permissions: string[] = ['intranet.roles.view', 'intranet.permissions.view'];
  mode: PermissionMode = 'any';
}

describe('UohHasPermissionDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let accessState: ReturnType<typeof signal<{ isSuperAdmin: boolean; permissions: string[] }>>;

  beforeEach(async () => {
    accessState = signal({
      isSuperAdmin: false,
      permissions: [],
    });

    const authService = {
      isSuperAdmin: vi.fn(() => accessState().isSuperAdmin),
      hasAnyPermission: vi.fn((permissions: string[]) => {
        const access = accessState();

        return access.isSuperAdmin || permissions.some((permission) => access.permissions.includes(permission));
      }),
      hasAllPermissions: vi.fn((permissions: string[]) => {
        const access = accessState();

        return access.isSuperAdmin || permissions.every((permission) => access.permissions.includes(permission));
      }),
    };

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
  });

  it('shows content when the user has a simple permission', async () => {
    accessState.set({
      isSuperAdmin: false,
      permissions: ['intranet.users.view'],
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.single')).not.toBeNull();
  });

  it('hides content when the user does not have the permission', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.single')).toBeNull();
  });

  it('uses any mode by default for multiple permissions', async () => {
    accessState.set({
      isSuperAdmin: false,
      permissions: ['intranet.permissions.view'],
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.multi')).not.toBeNull();
  });

  it('requires all permissions when mode is all', async () => {
    fixture.componentInstance.mode = 'all';
    accessState.set({
      isSuperAdmin: false,
      permissions: ['intranet.permissions.view'],
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.multi')).toBeNull();

    accessState.set({
      isSuperAdmin: false,
      permissions: ['intranet.roles.view', 'intranet.permissions.view'],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.multi')).not.toBeNull();
  });

  it('shows content for super admin without adding super admin permission to the DOM', async () => {
    accessState.set({
      isSuperAdmin: true,
      permissions: [],
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.single')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.multi')).not.toBeNull();
  });
});
