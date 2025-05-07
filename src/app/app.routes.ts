import { Routes } from '@angular/router';

import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'history',
    loadComponent: () => import('./history/history.component').then((m) => m.HistoryComponent),
  },
  {
    path: 'music',
    loadComponent: () => import('./music/music.component').then((m) => m.MusicComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then((m) => m.SettingsComponent),
    canActivate: [AutoLoginPartialRoutesGuard],
  },
];
