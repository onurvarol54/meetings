import { NgClass } from '@angular/common';
import { httpResource } from '@angular/common/http';
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
import { Router } from '@angular/router';
import Blank from '../../../components/blank/blank';
import { ODataModel } from '../../../models/odata.model';
import { RoleModel } from '../../../models/role.model';
import { UserModel, initialUser } from '../../../models/user.model';
import { BreadcrumbModel, BreadcrumbService } from '../../../services/breadcrumb';
import { Common } from '../../../services/common';
import { HttpService } from '../../../services/http';
import { FlexiToastService } from 'flexi-toast';
import { FormValidateDirective } from 'form-validate-angular';
import { lastValueFrom } from 'rxjs';
import { RoleNameTrPipe } from '../../../pipes/role-name-tr';

@Component({
  imports: [Blank, FormsModule, FormValidateDirective, NgClass, RoleNameTrPipe],
  templateUrl: './add.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Add {
  readonly #breadcrumb = inject(BreadcrumbService);
  readonly #http = inject(HttpService);
  readonly #toast = inject(FlexiToastService);
  readonly #router = inject(Router);
  readonly #common = inject(Common);

  readonly id = signal<string | undefined>('');
  readonly branchId = signal<string | undefined>('');

  userNameLocal: string = '';

  readonly breadcrumbs = signal<BreadcrumbModel[]>([
    {
      title: 'Kullanıclar',
      icon: 'bi-people',
      url: '/users',
    },
  ]);

  readonly pageTitle = computed(() => (this.id() ? 'Kullanıcı Güncelle' : 'Kullanıcı Ekle'));
  readonly pageIcon = computed(() => (this.id() ? 'bi-person-check' : 'bi-person-add'));
  readonly btnName = computed(() => (this.id() ? 'Güncelle' : 'Kaydet'));

  //user'ı çek
  readonly result = resource({
    params: () => this.id(),
    loader: async () => {
      if (!this.id()) return null;

      const res = await lastValueFrom(
        this.#http.getResource<UserModel>(`/board-decisions/users/${this.id()}`),
      );

      // Edit modunda: mevcut kullanıcı adının local kısmını forma yansıt
      const fullUserName = res.data?.userName ?? '';
      const sakaryaSuffix = '@sakarya.edu.tr';
      this.userNameLocal = fullUserName.toLowerCase().endsWith(sakaryaSuffix)
        ? fullUserName.substring(0, fullUserName.length - sakaryaSuffix.length)
        : fullUserName;

      this.breadcrumbs.update((prev) => [
        ...prev,
        {
          title: res.data!.fullName,
          icon: 'bi-pencil-square',
          url: `/users/edit/${this.id()}`,
          isActive: true,
        },
      ]);
      this.#breadcrumb.reset(this.breadcrumbs());

      return res.data;
    },
  });

  readonly data = linkedSignal(() => this.result.value() ?? { ...initialUser });
  readonly loading = linkedSignal(() => this.result.isLoading());

  // OData roles
  readonly roleResult = httpResource<ODataModel<RoleModel>>(() => '/board-decisions/odata/roles');
  readonly roles = computed(() => this.roleResult.value()?.value.filter((r) => r.isActive) ?? []);
  readonly roleLoading = computed(() => this.roleResult.isLoading());

  readonly managerMode = computed(() => this.isManagerSelected());
  readonly managerAutoApplied = signal(false);
  readonly departmentLoadingText = signal('Bölümler listeleniyor...');

  private isManagerSelected(): boolean {
    const selectedRoleId = this.data().roleId;
    if (!selectedRoleId) return false;
    const role = this.roles().find((r) => r.id === selectedRoleId);
    return (role?.name ?? '').trim().toLowerCase() === 'manager';
  }

  save(form: NgForm) {
    if (!form.valid) return;

    // userName sadece local kısmı, email tam adres olacak şekilde ayarla
    const localUserName = (this.userNameLocal ?? '').trim();
    const sakaryaSuffix = '@sakarya.edu.tr';
    if (localUserName) {
      const email = localUserName.toLowerCase().endsWith(sakaryaSuffix)
        ? localUserName
        : `${localUserName}${sakaryaSuffix}`;

      this.data.update((prev) => ({
        ...prev,
        userName: localUserName,
        email: email,
      }));
    }

    if (!this.id()) {
      this.loading.set(true);
      this.#http.post<string>(
        '/board-decisions/users',
        this.data(),
        (res) => {
          this.#toast.showToast('Başarılı', res, 'success');
          this.#router.navigateByUrl('/users');
          this.loading.set(false);
        },
        () => this.loading.set(false),
      );
    } else {
      this.loading.set(true);
      this.#http.put<string>(
        '/board-decisions/users',
        this.data(),
        (res) => {
          this.#toast.showToast('Başarılı', res, 'info');
          this.#router.navigateByUrl('/users');
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

  checkIsAdmin() {
    return this.#common.decode().role === 'sys_admin';
  }

  setRoleId(roleId: string | null) {
    this.data.update((prev) => ({
      ...prev,
      roleId: roleId ?? '',
    }));
  }
}
