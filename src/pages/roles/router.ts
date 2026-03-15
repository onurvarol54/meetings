import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { Common } from '../../services/common';

const router: Routes = [
  {
    path: '',
    loadComponent: () => import('./roles'),
    canActivate: [() => inject(Common).checkPermissionForRoute('role:view')],
  },
  {
    path: 'add',
    loadComponent: () => import('./add/add'),
    canActivate: [() => inject(Common).checkPermissionForRoute('role:add')],
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./add/add'),
    canActivate: [() => inject(Common).checkPermissionForRoute('role:edit')],
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./detail/detail'),
    canActivate: [() => inject(Common).checkPermissionForRoute('role:view')],
  },
  {
    path: 'permissions/:id',
    loadComponent: () => import('./permissions/permissions'),
    canActivate: [
      () => inject(Common).checkPermissionForRoute('role:update_permissions'),
    ],
  },
];

export default router;
