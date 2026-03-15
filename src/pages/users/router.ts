import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { Common } from '../../services/common';

const router: Routes = [
  {
    path: '',
    loadComponent: () => import('./users'),
    canActivate: [() => inject(Common).checkPermissionForRoute('user:view')],
  },
  {
    path: 'add',
    loadComponent: () => import('./add/add'),
    canActivate: [() => inject(Common).checkPermissionForRoute('user:add')],
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./add/add'),
    canActivate: [() => inject(Common).checkPermissionForRoute('user:edit')],
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./detail/detail'),
    canActivate: [() => inject(Common).checkPermissionForRoute('user:view')],
  },
];

export default router;
