import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: 'welcome', loadComponent: () => import('./views/welcome/welcome').then(m => m.WelcomeComponent) },
  { path: 'rpd', loadComponent: () => import('./views/rpd/rpd').then(m => m.RpdComponent) },
  { path: 'verify', loadComponent: () => import('./views/verify/verify').then(m => m.VerifyComponent) },
  { path: 'expo', loadComponent: () => import('./views/expo/expo').then(m => m.ExpoComponent) },
  { path: 'ec', loadComponent: () => import('./views/ec/ec').then(m => m.EcComponent) },
  { path: 'relax', loadComponent: () => import('./views/relax/relax').then(m => m.RelaxComponent) },
  { path: 'history', loadComponent: () => import('./views/history/history').then(m => m.HistoryComponent) },
  { path: '**', redirectTo: 'welcome' }
];
