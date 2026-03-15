import { Location } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Result } from '../../../models/result.model';
import { initialRole, RoleModel } from '../../../models/role.model';
import { BreadcrumbModel, BreadcrumbService } from '../../../services/breadcrumb';
import { HttpService } from '../../../services/http';
import { FlexiToastService } from 'flexi-toast';
import { FlexiTreeNode, FlexiTreeviewComponent, FlexiTreeviewService } from 'flexi-treeview';
import { RoleNameTrPipe } from '../../../pipes/role-name-tr';

@Component({
  imports: [FlexiTreeviewComponent, RoleNameTrPipe],
  templateUrl: './permissions.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Permissions {
  readonly #activatedRoute = inject(ActivatedRoute);
  readonly #breadcrumb = inject(BreadcrumbService);
  readonly #treeview = inject(FlexiTreeviewService);
  readonly #http = inject(HttpService);
  readonly #toast = inject(FlexiToastService);
  readonly #location = inject(Location);

  readonly id = signal<string>('');
  readonly rolResult = httpResource<Result<RoleModel>>(() => `/board-decisions/roles/${this.id()}`);
  readonly rolData = computed(() => this.rolResult.value()?.data ?? initialRole);
  readonly treeviewTitle = computed(() => `${this.rolData().name} Rolü İzinleri`);

  readonly result = httpResource<Result<string[]>>(() => '/board-decisions/permissions');
  readonly data = computed(() => {
    const data = this.result.value()?.data ?? [];
    const nodes = data.map((val) => {
      var parts = val.split(':');
      var data = { id: val, name: parts[0], code: parts[1] };
      return data;
    });
    const treeNodes: FlexiTreeNode[] = this.#treeview.convertToTreeNodes(
      nodes,
      'id',
      'name',
      'code',
    );

    treeNodes.forEach((node) => {
      node.children?.forEach((child) => {
        child.selected = this.rolData().permissions.includes(child.originalData.id);
        child.name = this.capitalizeFirstTr(child.name);
      });

      node.selected = !node.children?.some((child) => !child.selected);
      node.indeterminate =
        !!node.children?.some((child) => child.selected) &&
        !node.children?.every((child) => child.selected);

      node.name = this.capitalizeFirstTr(node.name);
    });

    return treeNodes;
  });

  readonly loading = computed(() => this.result.isLoading());
  readonly breadcrumbs = signal<BreadcrumbModel[]>([]);

  readonly selectedPermissions = linkedSignal<{
    roleId: string;
    permissions: string[];
  }>(() => ({
    roleId: this.id(),
    permissions: [],
  }));

  constructor() {
    this.#activatedRoute.params.subscribe((params) => {
      this.id.set(params['id']);
    });

    effect(() => {
      this.breadcrumbs.set([
        {
          title: 'Roller',
          icon: 'bi-clipboard2-check',
          url: '/roles',
        },
        {
          title: this.rolData().name + ' Rolü İzinleri',
          icon: 'bi-key',
          url: `/roles/permissions/${this.id()}`,
          isActive: true,
        },
      ]);
      this.#breadcrumb.reset(this.breadcrumbs());
    });
  }
  onSelected(event: any) {
    this.selectedPermissions.update((prev) => ({
      ...prev,
      permissions: event.map((val: any) => val.id),
    }));
  }

  updatePermissions() {
    if (this.selectedPermissions().permissions.length === 0) {
      this.#toast.showSwal(
        'Uyarı',
        'Tüm izinleri silmek isyor musunuz?',
        'Sil',
        () => {
          this.#http.put<Result<any>>(
            '/board-decisions/roles/update-permissions',
            this.selectedPermissions(),
            (res) => {
              this.#toast.showToast('Başarılı', 'İzinler silindi', 'success');
              this.#location.back();
            },
          );
        },
        'İptal',
        () => {
          this.result.reload();
        },
      );
    } else {
      this.#http.put<Result<any>>(
        '/board-decisions/roles/update-permissions',
        this.selectedPermissions(),
        (res) => {
          this.#toast.showToast('Başarılı', res.data ?? 'İzinler güncellendi', 'success');
          this.#location.back();
        },
      );
    }
  }

  capitalizeFirstTr(text: string): string {
    if (!text) return '';

    const firstChar = text.charAt(0).toLocaleUpperCase('tr-TR');
    const rest = text.slice(1);

    return firstChar + rest;
  }
}
