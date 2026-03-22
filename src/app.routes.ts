import { Route } from '@angular/router';
import { inject } from '@angular/core';
import { authGuard } from './guards/auth-guard';
import { Common } from './services/common';
import { MeetingPageComponent } from './pages/home/meeting/meeting';
import { HomePageComponent } from './pages/home/homepage/homepage';
import { PublicLayoutComponent } from './pages/layouts/public-layout';

export const appRoutes: Route[] = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        component: HomePageComponent,
      },
      {
        path: 'meeting',
        component: MeetingPageComponent,
      },
    ],
  },

  {
    path: 'unauthorize',
    loadComponent: () => import('./pages/unauthorize/unauthorize'),
  },
  {
    path: 'unavailable',
    loadComponent: () => import('./pages/unavailable/unavailable'),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login'),
  },
  {
    path: 'reset-password/:id',
    loadComponent: () => import('./pages/auth/reset-password/reset-password'),
  },
  {
    path: '',
    loadComponent: () => import('./pages/layouts/layouts'),
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard'),
        canActivate: [() => inject(Common).checkPermissionForRoute('dashboard:view')],
      },
      {
        path: 'meetings',
        loadChildren: () => import('./pages/meetings/router'),
      },
      {
        path: 'roles',
        loadChildren: () => import('./pages/roles/router'),
      },
      {
        path: 'users',
        loadChildren: () => import('./pages/users/router'),
      },
    ],
  },
];
