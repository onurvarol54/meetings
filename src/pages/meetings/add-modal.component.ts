import {
  Component,
  EventEmitter,
  Output,
  Input,
  inject,
  signal,
  computed,
  resource,
  linkedSignal,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { MeetingModel, initialMeeting } from '../../models/meeting.model';
import { FormsModule } from '@angular/forms';
import { FormValidateDirective } from 'form-validate-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { FlexiToastService } from 'flexi-toast';
import { HttpService } from '../../services/http';
import { lastValueFrom } from 'rxjs/internal/lastValueFrom';

export const examTypeList = [
  { value: 1, label: 'Yeterlik Sınavı' },
  { value: 2, label: 'Tez Önerisi Sınavı' },
  { value: 3, label: 'Tez İzleme Sınavı' },
  { value: 4, label: 'Tez Savunma Sınavı' },
];

@Component({
  selector: 'app-add-meeting',
  standalone: true,
  imports: [FormsModule, FormValidateDirective],
  template: `
    <form #form="ngForm" formValidate class="admin-form" (ngSubmit)="save(form)">
      <div class="mb-3">
        <label>Başlık</label>
        <input
          type="text"
          class="form-control"
          [(ngModel)]="formData.title"
          name="title"
          required
        />
        <div class="invalid-feedback">Geçerli bir başlık girin!</div>
      </div>
      <div class="mb-3">
        <label>Tarih ve Saat</label>
        <input
          type="datetime-local"
          class="form-control"
          [(ngModel)]="formData.scheduledAt"
          name="scheduledAt"
          required
        />
        <div class="invalid-feedback">Geçerli bir tarih ve saat girin!</div>
      </div>
      <div class="mb-3">
        <label>Açıklama</label>
        <textarea
          class="form-control"
          [(ngModel)]="formData.description"
          name="description"
        ></textarea>
      </div>
      <div class="mb-3">
        <label>Sınav Tipi</label>
        <select class="form-control" [(ngModel)]="formData.examType" name="examType" required>
          <option [value]="0" disabled>Seçiniz</option>
          @for (item of examTypeList(); track $index) {
            <option [value]="item.value" [selected]="formData.examType.valueOf() === item.value">
              {{ item.label }}
            </option>
          }
        </select>
        <div class="invalid-feedback">Geçerli bir sınav türü girin!</div>
      </div>

      <div class="d-flex justify-content-end">
        <button type="submit" class="btn btn-primary">
          {{ btnName() }}
        </button>
      </div>
    </form>
  `,
})
export class AddMeetingComponent implements OnInit, OnChanges {
  @Input() key: number = 0;
  @Output() saved = new EventEmitter<void>();
  readonly #http = inject(HttpService);
  readonly #toast = inject(FlexiToastService);

  formData: MeetingModel = { ...initialMeeting };
  readonly examTypeList = computed(() => examTypeList);
  readonly btnName = computed(() => (this.formData.id ? 'Güncelle' : 'Kaydet'));
  readonly loading = signal(false);

  ngOnInit() {
    this.resetForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['key']) {
      this.resetForm();
    }
  }

  resetForm() {
    this.formData = { ...initialMeeting };
  }

  save(form: NgForm) {
    if (!form.valid) return;
    const payload = { ...this.formData, examType: Number(this.formData.examType) };
    if (payload.examType === 0) {
      this.#toast.showToast('Hata', 'Lütfen geçerli bir sınav tipi seçin!', 'error');
      return;
    }

    this.loading.set(true);
    this.#http.post<string>(
      '/board-decisions/meetings',
      payload,
      (res) => {
        this.#toast.showToast('Başarılı', res, 'success');
        this.saved.emit();
        this.loading.set(false);
      },
      () => this.loading.set(false),
    );
  }
}
