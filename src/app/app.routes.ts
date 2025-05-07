import { Routes } from '@angular/router';

import { MusicComponent } from './music/music.component';
import { SettingsComponent } from './user/settings/settings.component';
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'music',
    component: MusicComponent,
  },
  { path: 'settings', component: SettingsComponent, canActivate: [AutoLoginPartialRoutesGuard] },
];
