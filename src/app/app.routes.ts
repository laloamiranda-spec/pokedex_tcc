import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },

  // Public-only routes (redirect to /welcome if already logged in)
  { path: 'login',           canActivate: [publicGuard], loadComponent: () => import('./views/login/login').then(m => m.LoginComponent) },
  { path: 'register',        canActivate: [publicGuard], loadComponent: () => import('./views/register/register').then(m => m.RegisterComponent) },
  { path: 'forgot-password', canActivate: [publicGuard], loadComponent: () => import('./views/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },

  // Protected routes
  { path: 'welcome', canActivate: [authGuard], loadComponent: () => import('./views/welcome/welcome').then(m => m.WelcomeComponent) },
  { path: 'rpd',     canActivate: [authGuard], loadComponent: () => import('./views/rpd/rpd').then(m => m.RpdComponent) },
  { path: 'verify',  canActivate: [authGuard], loadComponent: () => import('./views/verify/verify').then(m => m.VerifyComponent) },
  { path: 'expo',    canActivate: [authGuard], loadComponent: () => import('./views/expo/expo').then(m => m.ExpoComponent) },
  { path: 'ec',      canActivate: [authGuard], loadComponent: () => import('./views/ec/ec').then(m => m.EcComponent) },
  { path: 'relax',   canActivate: [authGuard], loadComponent: () => import('./views/relax/relax').then(m => m.RelaxComponent) },
  { path: 'history', canActivate: [authGuard], loadComponent: () => import('./views/history/history').then(m => m.HistoryComponent) },

  { path: '**', redirectTo: 'welcome' }
];
