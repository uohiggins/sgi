import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderIcons, SidebarItem, UohHeader, UohSidebar } from 'uoh-ui';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth-service';
import { HeaderService } from '../../sgi/services/header-service';

@Component({
  selector: 'main-layout',
  standalone: true,
  imports: [UohSidebar, UohHeader, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MainLayout implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly headerService = inject(HeaderService);

  readonly offcanvasId = 'offcanvas-menu';

  readonly appTitle = computed(
    () => this.authService.currentApplication()?.name || environment.APP_NAME,
  );

  private readonly routeTitle = signal<string>('');
  private readonly serviceTitle = toSignal(this.headerService.title, { initialValue: 'Inicio' });
  readonly headerSubTitle = toSignal(this.headerService.subTitle, { initialValue: '' });

  readonly headerTitle = computed(() => this.routeTitle() || this.serviceTitle());

  readonly menuItems = signal<SidebarItem[]>([
    {
      label: 'Inicio',
      icon: 'fa-house',
      path: '/home',
    },
    {
      label: 'Mantenedor de Proyectos',
      icon: 'fa-person-chalkboard',
      path: '/mantenedor-proyectos',
      exactMatch: false,
    },
  ]);

  readonly menuIcons = signal<HeaderIcons[]>([]);

  ngOnInit(): void {
    this.syncRouteTitle();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.syncRouteTitle());
  }

  onLogout(): void {
    this.authService.logout();
  }

  private syncRouteTitle(): void {
    let current: ActivatedRoute | null = this.activatedRoute.root;
    let resolvedTitle = '';

    while (current) {
      const title = current.snapshot.title;
      if (title) {
        resolvedTitle = title;
      }
      current = current.firstChild;
    }

    this.routeTitle.set(resolvedTitle);
  }
}
