import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { initialParticipant, ParticipantModel } from '../../../models/participant.model';
import { FlexiToastService } from 'flexi-toast';
import { HttpService } from '../../../services/http';

export const participantStatusList = [
  { value: 0, label: 'Öğrenci' },
  { value: 1, label: 'Üye' },
  { value: 2, label: 'Koordinatör' },
];

export const participantTitleList = [
  { value: 1, label: 'Prof. Dr.' },
  { value: 2, label: 'Doç. Dr.' },
  { value: 3, label: 'Öğr. Üyesi Dr.' },
  { value: 4, label: 'Öğrenci' },
];

@Component({
  selector: 'app-participants-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './participants.html',
})
export class ParticipantsComponent implements OnInit, OnChanges {
  @Input() key = 0;
  @Input() meetingId = '';
  @Input() meetingTitleInput = '';

  @Output() closed = new EventEmitter<void>();

  @ViewChild('participantForm') participantForm?: NgForm;

  readonly #http = inject(HttpService);
  readonly #toast = inject(FlexiToastService);

  readonly loading = signal(false);
  readonly listLoading = signal(false);

  readonly editingParticipant = signal<ParticipantModel | null>(null);
  readonly buttonText = computed(() =>
    this.editingParticipant() ? 'Katılımcıyı Güncelle' : 'Katılımcı Ekle',
  );
  readonly buttonColor = computed(() =>
    this.editingParticipant() ? 'btn btn-warning' : 'btn btn-primary',
  );

  formData: ParticipantModel = { ...initialParticipant };
  participants = signal<ParticipantModel[]>([]);

  readonly statusList = computed(() => participantStatusList);
  readonly titleList = computed(() => participantTitleList);
  readonly meetingTitle = computed(() => this.meetingTitleInput);

  ngOnInit() {
    this.prepareForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['key'] || changes['meetingId'] || changes['meetingTitleInput']) {
      this.prepareForm();
      this.loadParticipants();
    }
  }

  prepareForm() {
    this.formData = {
      ...initialParticipant,
      meetingId: this.meetingId,
      title: 1,
      status: 1,
    };

    setTimeout(() => {
      this.participantForm?.resetForm(this.formData);
    });
  }

  loadParticipants() {
    if (!this.meetingId) {
      this.participants.set([]);
      return;
    }

    this.listLoading.set(true);

    this.#http
      .getResource<ParticipantModel[]>(`/board-decisions/participants/by-meeting/${this.meetingId}`)
      .subscribe({
        next: (res) => {
          this.participants.set(Array.isArray(res) ? res : []);
          this.listLoading.set(false);
        },
        error: () => {
          this.participants.set([]);
          this.listLoading.set(false);
          this.#toast.showToast('Hata', 'Katılımcı listesi getirilemedi.', 'error');
        },
      });
  }

  saveParticipant(form: NgForm) {
    if (!form.valid) {
      form.control.markAllAsTouched();
      return;
    }

    const payload: ParticipantModel = {
      ...this.formData,
      meetingId: this.meetingId,
      status: Number(this.formData.status),
      title: Number(this.formData.title),
    };

    this.loading.set(true);

    // EDIT MODE
    if (this.editingParticipant()) {
      this.#http.put<string>(
        '/board-decisions/participants',
        payload,

        (res) => {
          this.#toast.showToast('Başarılı', res, 'success');
          this.loading.set(false);

          this.editingParticipant.set(null);
          this.resetOnlyEntryForm();
          this.loadParticipants();
        },
        () => {
          this.loading.set(false);
        },
      );

      return;
    }

    // ADD MODE
    this.#http.post<string>(
      '/board-decisions/participants',
      payload,
      (res) => {
        this.#toast.showToast('Başarılı', res, 'success');
        this.loading.set(false);

        this.resetOnlyEntryForm();
        this.loadParticipants();
      },
      () => {
        this.loading.set(false);
        this.loadParticipants();
      },
    );
  }

  resetOnlyEntryForm() {
    this.editingParticipant.set(null);

    this.formData = {
      ...initialParticipant,
      meetingId: this.meetingId,
      title: 1,
      status: 1,
    };

    setTimeout(() => {
      this.participantForm?.resetForm(this.formData);
    });
  }

  editParticipant(item: ParticipantModel) {
    this.editingParticipant.set(item);

    this.formData = {
      ...item,
      meetingId: this.meetingId,
      title: Number(item.title),
      status: Number(item.status),
    };

    setTimeout(() => {
      this.participantForm?.resetForm(this.formData);
    });
  }

  delete(id: string, name?: string) {
    this.#toast.showSwal(
      'Sil!',
      `${name != null ? name : ''} kaydı silmek istiyormusunuz?`,
      'Sil',
      () => {
        this.#http.delete<string>(`/board-decisions/participants/${id}`, (res) => {
          name
            ? this.#toast.showToast(
                'Başrılı',
                `${name != null ? name : ''} adlı kayıt silindi.`,
                'info',
              )
            : this.#toast.showToast('Başrılı', res, 'info');
          this.participants.update((state) => state.filter((participant) => participant.id !== id));
        });
      },
    );
  }

  getStatusLabel(status: number): string {
    const item = participantStatusList.find((x) => x.value === Number(status));
    return item?.label ?? 'Bilinmeyen';
  }

  getTitleLabel(title: number): string {
    const item = participantTitleList.find((x) => x.value === Number(title));
    return item?.label ?? '';
  }

  onClose() {
    this.prepareForm();
    this.participants.set([]);
    this.closed.emit();
  }
}
