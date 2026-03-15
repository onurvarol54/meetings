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
import { MeetingModel, initialMeeting } from '../../../models/meeting.model';

// ExamType enum and options for select
export const examTypeList = [
  { value: 1, label: 'Yeterlik Sınavı' },
  { value: 2, label: 'Tez Önerisi Sınavı' },
  { value: 3, label: 'Tez İzleme Sınavı' },
  { value: 4, label: 'Tez Savunma Sınavı' },
];

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

  readonly examTypeOptions = computed(() => examTypeList);

  readonly id = signal<string | undefined>('');
  readonly breadcrumbs = signal<BreadcrumbModel[]>([
    {
      title: 'Toplantılar',
      icon: 'bi-calendar-week',
      url: '/meetings',
    },
  ]);
  readonly pageTitle = computed(() => (this.id() ? 'Toplantı Güncelle' : 'Toplantı Ekle'));
  readonly pageIcon = computed(() => (this.id() ? 'bi-calendar-edit' : 'bi-calendar-plus'));
  readonly btnName = computed(() => (this.id() ? 'Güncelle' : 'Kaydet'));

  readonly result = resource({
    params: () => this.id(),
    loader: async () => {
      if (!this.id()) return null;
      var res = await lastValueFrom(
        this.#http.getResource<MeetingModel>(`/board-decisions/meetings/${this.id()}`),
      );
      this.breadcrumbs.update((prev) => [
        ...prev,
        {
          title: res.data!.title,
          icon: 'bi-pencil-square',
          url: `/meetings/edit/${this.id()}`,
          isActive: true,
        },
      ]);
      this.#breadcrumb.reset(this.breadcrumbs());
      console.log(res.data);
      return res.data;
    },
  });

  readonly data = linkedSignal(() => this.result.value() ?? { ...initialMeeting });

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
            url: '/meetings/add',
            isActive: true,
          },
        ]);
        this.#breadcrumb.reset(this.breadcrumbs());
      }
    });
  }

  save(form: NgForm) {
    if (!form.valid) return;
    const payload = { ...this.data(), examType: Number(this.data().examType) };
    if (payload.examType === 0) {
      this.#toast.showToast('Hata', 'Lütfen geçerli bir sınav tipi seçin!', 'error');
      return;
    }

    if (!this.id()) {
      this.loading.set(true);
      this.#http.post<string>(
        '/board-decisions/meetings',
        payload,
        (res) => {
          this.#toast.showToast('Başarılı', res, 'success');
          this.#router.navigateByUrl('/meetings');
          this.loading.set(false);
        },
        () => this.loading.set(false),
      );
    } else {
      this.loading.set(true);
      this.#http.put<string>(
        '/board-decisions/meetings',
        payload,
        (res) => {
          this.#toast.showToast('Başarılı', res, 'info');
          this.#router.navigateByUrl('/meetings');
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
