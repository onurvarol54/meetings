import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MeetingJoinModel } from '../../../models/meeting-join.model';

@Component({
  selector: 'app-meeting-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './meeting.html',
})
export class MeetingPageComponent {
  readonly #router = inject(Router);

  private readonly nav = this.#router.getCurrentNavigation();
  private readonly navState = this.nav?.extras?.state as { meeting?: MeetingJoinModel } | undefined;

  meeting = signal<MeetingJoinModel | null>(this.navState?.meeting ?? this.readFromSession());

  participantCount = signal(2);
  messages = signal([
    { sender: 'Sistem', text: 'Toplantıya hoş geldiniz.' },
    { sender: 'Bilgi', text: 'Bağlantı kuruldu.' },
  ]);

  mainParticipantName = computed(() => this.meeting()?.fullName ?? 'Katılımcı');
  meetingTitle = computed(() => this.meeting()?.meetingTitle ?? 'Toplantı');
  meetingDate = computed(() => this.meeting()?.scheduledAt ?? null);

  ngOnInit() {
    if (!this.meeting()) {
      this.#router.navigate(['/']);
    }
  }

  getExamTypeLabel(value?: number): string {
    switch (value) {
      case 1:
        return 'Yeterlik Sınavı';
      case 2:
        return 'Tez Önerisi';
      case 3:
        return 'Tez İzleme';
      case 4:
        return 'Tez Savunma';
      default:
        return 'Toplantı';
    }
  }

  getParticipantTitleLabel(value?: number): string {
    const titles = [
      { value: 1, label: 'Prof. Dr.' },
      { value: 2, label: 'Doç. Dr.' },
      { value: 3, label: 'Öğr. Üyesi Dr.' },
      { value: 4, label: 'Öğrenci' },
    ];

    const title = titles.find((t) => t.value === value);
    return title ? title.label : '';
  }

  private readFromSession(): MeetingJoinModel | null {
    const raw = sessionStorage.getItem('meeting_join_data');
    if (!raw) return null;

    try {
      return JSON.parse(raw) as MeetingJoinModel;
    } catch {
      return null;
    }
  }
}
