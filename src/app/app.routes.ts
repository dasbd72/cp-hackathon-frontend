import { Routes } from '@angular/router';

import { SettingsComponent } from './user/settings/settings.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'user',
    children: [{ path: 'settings', component: SettingsComponent }],
  },
];
