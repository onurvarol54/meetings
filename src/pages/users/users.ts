import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { BreadcrumbModel } from '../../services/breadcrumb';
import Grid from '../../components/grid/grid';
import { FlexiGridModule } from 'flexi-grid';
import { Common } from '../../services/common';
import { RoleNameTrPipe } from '../../pipes/role-name-tr';

@Component({
  imports: [Grid, FlexiGridModule, RoleNameTrPipe],
  templateUrl: './users.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Users {
  readonly #common = inject(Common);

  readonly breadcrumbs = signal<BreadcrumbModel[]>([
    {
      title: 'Kullanıcılar',
      icon: 'bi-person-circle',
      url: '/users',
      isActive: true,
    },
  ]);

  checkPermission(permission: string) {
    return this.#common.checkPermission(permission);
  }
}
