import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'uoh-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './uoh-sidebar.html',
  styleUrl: './uoh-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UohSidebar {
  private router = inject(Router);

  // metodo para colocar link activo en el sidebar, se activa tanto para la ruta de agregar actividad como para la de editar actividad
  // add: /vcm/actividades/add/profile
  // edit: /vcm/actividades/123/profile
  isActivityFormRoute(): boolean {
    const url = this.router.url;

    return url.startsWith('/actividades/add') || /actividades\/\d+/.test(url);
  }
}
