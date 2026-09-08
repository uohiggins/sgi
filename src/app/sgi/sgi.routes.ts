import { Routes } from '@angular/router';

export const sgiRoutes: Routes = [
  {
    path: 'home',
    title: 'Inicio',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  }
];
