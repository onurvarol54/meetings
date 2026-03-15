import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  resource,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Blank from '../../../components/blank/blank';
import { initialRole, RoleModel } from '../../../models/role.model';
import { BreadcrumbModel, BreadcrumbService } from '../../../services/breadcrumb';
import { HttpService } from '../../../services/http';
import { FlexiToastService } from 'flexi-toast';
import { FormValidateDirective } from 'form-validate-angular';
import { lastValueFrom } from 'rxjs';

@Component({
  imports: [Blank, FormsModule, FormValidateDirective, NgClass],
  templateUrl: './add.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Add {
  readonly #breadcrumb = inject(BreadcrumbService);
  readonly #activated = inject(ActivatedRoute);
  readonly #http = inject(HttpService);
  readonly #toast = inject(FlexiToastService);
  readonly #router = inject(Router);

  readonly id = signal<string | undefined>('');
  readonly breadcrumbs = signal<BreadcrumbModel[]>([
    {
      title: 'Roller',
      icon: 'bi-clipboard2-check',
      url: '/roles',
    },
  ]);
  readonly pageTitle = computed(() => (this.id() ? 'Rol Güncelle' : 'Rol Ekle'));
  readonly pageIcon = computed(() => (this.id() ? 'bi-person-check' : 'bi-person-add'));
  readonly btnName = computed(() => (this.id() ? 'Güncelle' : 'Kaydet'));

  readonly result = resource({
    params: () => this.id(),
    loader: async () => {
      if (!this.id()) return null;
      var res = await lastValueFrom(
        this.#http.getResource<RoleModel>(`/board-decisions/roles/${this.id()}`),
      );

      this.breadcrumbs.update((prev) => [
        ...prev,
        {
          title: res.data!.name,
          icon: 'bi-pencil-square',
          url: `/role/edit/${this.id()}`,
          isActive: true,
        },
      ]);
      this.#breadcrumb.reset(this.breadcrumbs());
      return res.data;
    },
  });

  readonly data = linkedSignal(() => this.result.value() ?? { ...initialRole });
  readonly loading = linkedSignal(() => this.result.isLoading());

  constructor() {
    this.#activated.params.subscribe((res) => {
      if (res['id']) {
        this.id.set(res['id']);
      } else {
        this.breadcrumbs.update((prev) => [
          ...prev,
          {
            title: 'Ekle',
            icon: 'bi-plus',
            url: '/roles/add',
            isActive: true,
          },
        ]);
        this.#breadcrumb.reset(this.breadcrumbs());
      }
    });
  }
  save(form: NgForm) {
    if (!form.valid) return;

    if (!this.id()) {
      this.loading.set(true);
      this.#http.post<string>(
        '/board-decisions/roles',
        this.data(),
        (res) => {
          this.#toast.showToast('Başarılı', res, 'success');
          this.#router.navigateByUrl('/roles');
          this.loading.set(false);
        },
        () => this.loading.set(false),
      );
    } else {
      this.loading.set(true);
      this.#http.put<string>(
        '/board-decisions/roles',
        this.data(),
        (res) => {
          this.#toast.showToast('Başarılı', res, 'info');
          this.#router.navigateByUrl('/roles');
          this.loading.set(false);
        },
        () => this.loading.set(false),
      );
    }
  }

  changeStatus(status: boolean) {
    this.data.update((prev) => ({
      ...prev,
      isActive: status,
    }));
  }
}
