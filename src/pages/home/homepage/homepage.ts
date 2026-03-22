import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FlexiToastService } from 'flexi-toast';
import { MeetingJoinModel } from '../../../models/meeting-join.model';
import { HttpService } from '../../../services/http';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './homepage.html',
})
export class HomePageComponent {
  readonly #http = inject(HttpService);
  readonly #router = inject(Router);
  readonly #toast = inject(FlexiToastService);

  meetingCode = signal('');
  memberCode = signal('');
  loading = signal(false);

  joinMeeting() {
    const payload = {
      meetingCode: this.meetingCode().trim(),
      ParticipationKey: this.memberCode().trim(),
    };

    if (!payload.meetingCode || !payload.ParticipationKey) {
      this.#toast.showToast('Uyarı', 'Toplantı Kodu ve Üye Kodu zorunludur.', 'warning');
      return;
    }

    this.loading.set(true);

    this.#http.post<string>(
      '/board-decisions/meetings/join-by-key',
      payload,
      (res) => {
        this.loading.set(false);

        sessionStorage.setItem('meeting_join_data', JSON.stringify(res));

        this.#router.navigate(['/meeting'], {
          state: { meeting: res },
        });
      },
      () => {
        this.loading.set(false);
        this.#toast.showToast('Hata', 'Toplantı bilgileri doğrulanamadı.', 'error');
      },
    );
  }
}
