import {
  AfterViewInit,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MeetingJoinModel } from '../../../models/meeting-join.model';
import { WebRtcService } from '../../../services/webRtcService';
import { MediaStreamDirective } from '../../../directives/media-stream';
import { FlexiToastService } from 'flexi-toast';

@Component({
  selector: 'app-meeting-page',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MediaStreamDirective],
  templateUrl: './meeting.html',
  styleUrls: ['./meeting.css'],
})
export class MeetingPageComponent implements AfterViewInit {
  readonly #router = inject(Router);
  readonly rtc = inject(WebRtcService);
  readonly #toast = inject(FlexiToastService);

  private readonly nav = this.#router.getCurrentNavigation();
  private readonly navState = this.nav?.extras?.state as { meeting?: MeetingJoinModel } | undefined;

  meeting = signal<MeetingJoinModel | null>(this.navState?.meeting ?? this.readFromSession());
  messageText = signal('');
  isFullscreen = signal(false);

  remoteStreams = this.rtc.remoteStreams;
  messages = this.rtc.messages;
  isMicOn = this.rtc.isMicOn;
  isCameraOn = this.rtc.isCameraOn;
  isScreenSharing = this.rtc.isScreenSharing;
  activeScreenShareConnectionId = this.rtc.activeScreenShareConnectionId;
  activeScreenShareParticipantName = this.rtc.activeScreenShareParticipantName;
  canShareScreen = this.rtc.canShareScreen;

  participantCount = computed(() => 1 + this.remoteStreams().length);
  mainParticipantName = computed(() => this.meeting()?.fullName ?? 'Katılımcı');
  meetingTitle = computed(() => this.meeting()?.meetingTitle ?? 'Toplantı');
  meetingDate = computed(() => this.meeting()?.scheduledAt ?? null);
  localStream = computed(() => this.rtc.localMediaStream());

  mainVideoStream = computed(() => {
    const active = this.activeScreenShareConnectionId();

    // ekran paylaşımı yok → kamera
    if (!active) {
      return this.localStream();
    }

    // ekran paylaşan kişi BEN ise → screenStream
    if (active === this.rtc.getCurrentConnectionId()) {
      return this.rtc.getScreenStream() ?? this.localStream();
    }

    // başka biri paylaşıyorsa → onun stream'i
    const remote = this.remoteStreams().find((x) => x.connectionId === active);

    return remote?.stream ?? this.localStream();
  });

  @ViewChild('mainVideoCard') mainVideoCard!: ElementRef<HTMLDivElement>;
  @ViewChild('chatContainer') chatContainer!: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      this.messages();
      this.scrollToBottom();
    });
  }

  ngOnInit() {
    if (!this.meeting()) {
      this.#router.navigate(['/']);
    }

    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
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

    return titles.find((t) => t.value === value)?.label ?? '';
  }

  getRemoteDisplayName(item: any): string {
    return item.fullName || `Katılımcı ${item.connectionId.slice(0, 6)}`;
  }

  getRemoteInitial(connectionId: string): string {
    return connectionId?.charAt(0)?.toUpperCase() || 'K';
  }

  getRemoteFullLabel(item: any): string {
    const title = this.getParticipantTitleLabel(item.title);
    return `${title ? title + ' ' : ''}${item.fullName?.trim()}`;
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

  async ngAfterViewInit() {
    const meeting = this.meeting();
    if (!meeting) {
      this.#router.navigate(['/']);
      return;
    }

    await this.rtc.startLocalCamera();

    await this.rtc.init(
      'https://localhost:7051/hubs/meeting',
      meeting.hubToken,
      meeting.meetingId,
      meeting.participantId,
      meeting.fullName,
    );
    await this.rtc.loadCommentList(meeting.meetingId);
  }

  async toggleFullscreen() {
    const el = this.mainVideoCard?.nativeElement;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        this.isFullscreen.set(true);
      } else {
        await document.exitFullscreen();
        this.isFullscreen.set(false);
      }
    } catch (error) {
      console.error('Fullscreen açılamadı:', error);
    }
  }

  async sendMessage() {
    const text = this.messageText().trim();
    const meeting = this.meeting();

    if (!text || !meeting) return;

    await this.rtc.sendChatMessage(meeting.meetingId, meeting.fullName, text);
    this.messageText.set('');
  }

  handleFullscreenChange = () => {
    this.isFullscreen.set(!!document.fullscreenElement);
  };

  toggleMic() {
    this.rtc.toggleMic();
  }

  toggleCamera() {
    this.rtc.toggleCamera();
  }

  async toggleScreenShare() {
    if (this.isScreenSharing()) {
      await this.rtc.stopScreenShare();
    } else {
      await this.rtc.startScreenShare();
    }
  }

  isMyMessage(item: any): boolean {
    const meeting = this.meeting();
    if (!meeting) return false;

    return item.participantId === meeting.participantId;
  }

  isTyping = this.rtc.isTyping;
  typingUserName = this.rtc.typingUserName;

  onMessageInput(value: string) {
    this.messageText.set(value);

    const meeting = this.meeting();
    if (!meeting) return;

    this.rtc.notifyTyping(meeting.meetingId);
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatContainer) {
        const el = this.chatContainer.nativeElement;
        el.scrollTop = el.scrollHeight;

        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 50);
  }

  async ngOnDestroy() {
    await this.rtc.dispose();
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
  }
}
