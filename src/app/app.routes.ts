import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'custom',
    loadComponent: () => import('./custom/search-input/search-input')
  },
  {
    path: 'geocoder',
    loadComponent: () => import('./geocoder/geocoder')
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: 'custom'
  }
];
