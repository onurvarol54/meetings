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
import { initialRole, RoleModel } from '../../../models/role.model';
import { ToTitleCaseTrPipe } from '../../../pipes/to-title-case-tr';
import { BreadcrumbModel, BreadcrumbService } from '../../../services/breadcrumb';

@Component({
  imports: [Blank, ToTitleCaseTrPipe],
  templateUrl: './detail.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Detail {
  readonly #breadcrumb = inject(BreadcrumbService);
  readonly #activated = inject(ActivatedRoute);

  readonly id = signal<string>('');
  readonly breadcrumbs = signal<BreadcrumbModel[]>([]);
  readonly result = httpResource<Result<RoleModel>>(() => `/board-decisions/roles/${this.id()}`);
  readonly data = computed(() => this.result.value()?.data ?? initialRole);
  readonly loading = computed(() => this.result.isLoading());
  readonly pageTitle = signal<string>('Rol Detay');

  constructor() {
    this.#activated.params.subscribe((res) => {
      this.id.set(res['id']);
    });

    effect(() => {
      const breadCrrumbs: BreadcrumbModel[] = [
        {
          title: 'Roller',
          icon: 'bi-clipboard2-check',
          url: '/roles',
        },
      ];

      if (this.data()) {
        this.breadcrumbs.set(breadCrrumbs);
        this.breadcrumbs.update((prev) => [
          ...prev,
          {
            title: this.data().name,
            icon: 'bi-zoom-in',
            url: `/roles/detail/${this.id()}`,
            isActive: true,
          },
        ]);
        this.#breadcrumb.reset(this.breadcrumbs());
      }
    });
  }
}
