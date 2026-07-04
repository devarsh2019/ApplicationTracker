import { Routes } from '@angular/router';

import { authGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
    title: 'Dashboard · Application Tracker',
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics').then((m) => m.Analytics),
    canActivate: [authGuard],
    title: 'Analytics · Application Tracker',
  },
  {
    path: 'calendar',
    loadComponent: () => import('./features/calendar/calendar').then((m) => m.CalendarPage),
    canActivate: [authGuard],
    title: 'Calendar · Application Tracker',
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
