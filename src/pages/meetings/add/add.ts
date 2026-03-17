import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MeetingModel, initialMeeting } from '../../../models/meeting.model';

// ExamType enum and options for select
export const examTypeList = [
  { value: 1, label: 'Yeterlik Sınavı' },
  { value: 2, label: 'Tez Önerisi Sınavı' },
  { value: 3, label: 'Tez İzleme Sınavı' },
  { value: 4, label: 'Tez Savunma Sınavı' },
];

import { HttpService } from '../../../services/http';
import { FlexiToastService } from 'flexi-toast';
import { FormValidateDirective } from 'form-validate-angular';
@Component({
  selector: 'app-add-meeting',
  imports: [FormsModule, FormValidateDirective],
  templateUrl: './add.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Add implements OnInit, OnChanges {
  @Input() key = 0;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() meeting: MeetingModel | null = null;

  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('meetingForm') meetingForm?: NgForm;

  readonly #http = inject(HttpService);
  readonly #toast = inject(FlexiToastService);

  formData: MeetingModel = { ...initialMeeting };

  readonly loading = signal(false);
  readonly examTypes = computed(() => examTypeList);
  readonly title = computed(() => (this.mode === 'edit' ? 'Toplantı Güncelle' : 'Toplantı Ekle'));
  readonly buttonText = computed(() => (this.mode === 'edit' ? 'Güncelle' : 'Kaydet'));

  ngOnInit() {
    this.prepareForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['key'] || changes['mode'] || changes['meeting']) {
      this.prepareForm();
    }
  }

  prepareForm() {
    if (this.mode === 'edit' && this.meeting) {
      this.formData = {
        ...initialMeeting,
        ...this.meeting,
        scheduledAt: this.toDateTimeLocal(this.meeting.scheduledAt),
      };

      setTimeout(() => {
        this.meetingForm?.resetForm(this.formData);
      });
      return;
    }

    this.resetForm();
  }

  resetForm() {
    this.formData = {
      ...initialMeeting,
      examType: 0,
    };

    setTimeout(() => {
      this.meetingForm?.resetForm(this.formData);
    });
  }

  onClose() {
    this.resetForm();
    this.closed.emit();
  }

  save(form: NgForm) {
    if (!form.valid) {
      form.control.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.formData,
      examType: Number(this.formData.examType),
    };

    if (payload.examType === 0) {
      this.#toast.showToast('Hata', 'Lütfen geçerli bir sınav tipi seçin!', 'error');
      return;
    }

    this.loading.set(true);

    if (this.mode === 'edit') {
      this.#http.put<string>(
        '/board-decisions/meetings',
        payload,
        (res) => {
          this.#toast.showToast('Başarılı', res, 'success');
          this.loading.set(false);
          this.resetForm();
          this.saved.emit();
        },
        () => {
          this.loading.set(false);
        },
      );
      return;
    }

    this.#http.post<string>(
      '/board-decisions/meetings',
      payload,
      (res) => {
        this.#toast.showToast('Başarılı', res, 'success');
        this.loading.set(false);
        this.resetForm();
        this.saved.emit();
      },
      () => {
        this.loading.set(false);
      },
    );
  }

  private toDateTimeLocal(value: string | Date | null | undefined): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}`;
  }
}
