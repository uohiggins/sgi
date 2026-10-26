import { Routes } from '@angular/router';

export const sgiRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    title: 'Inicio',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'mantenedor-proyectos',
    title: 'Mantenedor de proyectos',
    loadComponent: () =>
      import(
        './features/mantenedor-proyectos/pages/mantenedor-proyectos-page/mantenedor-proyectos-page'
      ).then((m) => m.MantenedorProyectosPage),
  },
];
