import { Routes } from '@angular/router';
import MainLayout from './layouts/main-layout/main-layout';
import { authGuard } from './auth/guards/auth-guard';
import { publicGuard } from './auth/guards/public-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth/auth'),
    canActivate: [publicGuard],
    title: 'Iniciar sesión',
  },
  {
    path: 'sin-acceso',
    loadComponent: () => import('./auth/no-access/no-access'),
    canActivate: [authGuard],
    title: 'Sin acceso',
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    loadChildren: () => import('./sgi/sgi.routes').then((m) => m.sgiRoutes),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
