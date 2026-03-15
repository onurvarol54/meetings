import { httpResource } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import {
  FlexiGridColumnComponent,
  FlexiGridModule,
  FlexiGridService,
  StateFilterModel,
  StateModel,
  StateSortModel,
} from 'flexi-grid';
import { ODataModel } from '../../models/odata.model';
import { RouterLink } from '@angular/router';
import { HttpService } from '../../services/http';
import { FlexiToastService } from 'flexi-toast';
import { BreadcrumbModel, BreadcrumbService } from '../../services/breadcrumb';
import { NgTemplateOutlet } from '@angular/common';
import { Common } from '../../services/common';

export interface btnOptions {
  url: string;
  permission: string;
  name?: string;
}

export interface btnModalOptions {
  click: () => void;
  permission: string;
  name?: string;
}

@Component({
  selector: 'grid',
  imports: [FlexiGridModule, RouterLink, NgTemplateOutlet],
  templateUrl: './grid.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Grid implements AfterViewInit {
  readonly #grid = inject(FlexiGridService);
  readonly #http = inject(HttpService);
  readonly #toast = inject(FlexiToastService);
  readonly #breadcrumb = inject(BreadcrumbService);
  readonly #common = inject(Common);

  readonly pageTitle = input.required<string>();
  readonly captionTitle = input.required<string>();
  readonly endpoint = input.required<string>();
  readonly showAudit = input<boolean>(true);
  readonly addOptions = input<btnOptions>();
  readonly editOptions = input<btnOptions>();
  readonly addModalOptions = input<btnModalOptions>();
  readonly editModalOptions = input<btnModalOptions>();
  readonly detailOptions = input<btnOptions>();
  readonly deleteOptions = input<btnOptions>();
  readonly breadcrumbs = input.required<BreadcrumbModel[]>();
  readonly commandColumnWidth = input<string>('150px');
  readonly showIndex = input<boolean>(true);
  readonly showIsActive = input<boolean>(true);
  readonly sort = input<StateSortModel>({ field: '', dir: 'asc' });
  readonly filter = input<StateFilterModel[]>([]);
  readonly showExportExcelBtn = input<boolean>(false);
  readonly pageSize = input<number>(10);

  readonly columns = contentChildren(FlexiGridColumnComponent, {
    descendants: true,
  });
  readonly commandTemplateRef = contentChild<TemplateRef<any>>('commandTemplate');
  readonly columnCommandTemplateRef = contentChild<TemplateRef<any>>('columnCommandTemplate');
  readonly state = signal<StateModel>(new StateModel());

  readonly result = httpResource<ODataModel<any>>(() => {
    let endpoint = this.endpoint();

    if (endpoint.includes('?')) {
      endpoint += '&$count=true';
    } else {
      endpoint += '?$count=true';
    }
    const part = this.#grid.getODataEndpoint(this.state());
    endpoint += `&${part}`;
    return endpoint;
  });

  readonly data = computed(() => {
    return this.result.value()?.value ?? [];
  });
  readonly total = computed(() => this.result.value()?.['@odata.count'] ?? 0);
  readonly loading = computed(() => this.result.isLoading());

  ngAfterViewInit(): void {
    this.#breadcrumb.reset(this.breadcrumbs());
  }

  dataStateChange(state: StateModel): void {
    this.state.set(state);
  }

  delete(id: string, name?: string) {
    this.#toast.showSwal(
      'Sil!',
      `${name != null ? name : ''} kaydı silmek istiyormusunuz?`,
      'Sil',
      () => {
        this.#http.delete<string>(`${this.deleteOptions()?.url}/${id}`, (res) => {
          name
            ? this.#toast.showToast(
                'Başrılı',
                `${name != null ? name : ''} adlı kayıt silindi.`,
                'info',
              )
            : this.#toast.showToast('Başrılı', res, 'info');
          this.result.reload();
        });
      },
    );
  }

  checkPermission(permission: string) {
    return this.#common.checkPermission(permission);
  }
}
