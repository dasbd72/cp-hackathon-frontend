import { Routes } from '@angular/router';

import { PreferencesComponent } from './user/preferences/preferences.component';
import { SettingsComponent } from './user/settings/settings.component';
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  { path: 'settings', component: SettingsComponent, canActivate: [AutoLoginPartialRoutesGuard] },
  {
    path: 'preferences',
    component: PreferencesComponent,
    canActivate: [AutoLoginPartialRoutesGuard],
  },
];
