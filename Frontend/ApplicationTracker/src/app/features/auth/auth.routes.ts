import { Routes } from '@angular/router';

import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { guestGuard } from './guards/auth.guard';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard],
    title: 'Sign in · Application Tracker',
  },
  {
    path: 'register',
    component: Register,
    canActivate: [guestGuard],
    title: 'Create account · Application Tracker',
  },
];
