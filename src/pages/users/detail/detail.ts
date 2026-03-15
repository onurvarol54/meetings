import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Blank from '../../../components/blank/blank';
import { Result } from '../../../models/result.model';
import { initialUser, UserModel } from '../../../models/user.model';
import { RoleNameTrPipe } from '../../../pipes/role-name-tr';
import { BreadcrumbModel, BreadcrumbService } from '../../../services/breadcrumb';

@Component({
  imports: [Blank, RoleNameTrPipe],
  templateUrl: './detail.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Detail {
  readonly #breadcrumb = inject(BreadcrumbService);
  readonly #activated = inject(ActivatedRoute);

  readonly id = signal<string>('');
  readonly breadcrumbs = signal<BreadcrumbModel[]>([]);
  readonly result = httpResource<Result<UserModel>>(() => `/board-decisions/users/${this.id()}`);
  readonly data = computed(() => this.result.value()?.data ?? initialUser);
  readonly loading = computed(() => this.result.isLoading());
  readonly pageTitle = signal<string>('Kullanıcı Detay');

  constructor() {
    this.#activated.params.subscribe((res) => {
      this.id.set(res['id']);
    });

    effect(() => {
      const breadCrrumbs: BreadcrumbModel[] = [
        {
          title: 'Kullanıcılar',
          icon: 'bi-people',
          url: '/users',
        },
      ];

      if (this.data()) {
        this.breadcrumbs.set(breadCrrumbs);
        this.breadcrumbs.update((prev) => [
          ...prev,
          {
            title: this.data().firstName + ' ' + this.data().lastName,
            icon: 'bi-zoom-in',
            url: `/users/detail/${this.id()}`,
            isActive: true,
          },
        ]);
        this.#breadcrumb.reset(this.breadcrumbs());
      }
    });
  }
}
