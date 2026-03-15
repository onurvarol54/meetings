import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { Common } from '../../services/common';

const router: Routes = [
  {
    path: '',
    loadComponent: () => import('./meetings'),
    canActivate: [() => inject(Common).checkPermissionForRoute('meeting:view')],
  },
  {
    path: 'add',
    loadComponent: () => import('./add/add'),
    canActivate: [() => inject(Common).checkPermissionForRoute('meeting:add')],
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./add/add'),
    canActivate: [() => inject(Common).checkPermissionForRoute('meeting:edit')],
  },
  // {
  //   path: 'detail/:id',
  //   loadComponent: () => import('./detail/detail'),
  //   canActivate: [() => inject(Common).checkPermissionForRoute('meeting:view')],
  // },
];

export default router;
