import { inject, Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { FlexiToastService } from 'flexi-toast';

export interface RemoteParticipantStream {
  connectionId: string;
  stream: MediaStream;
  participantId?: string;
  fullName?: string;
  title?: number;
  email?: string;
}

export interface ChatMessageModel {
  id?: string;
  meetingId?: string;
  participantId?: string;
  fullName?: string;
  text: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class WebRtcService {
  readonly #toast = inject(FlexiToastService);

  private hub!: signalR.HubConnection;
  private pcs = new Map<string, RTCPeerConnection>();
  private remoteStreamsMap = new Map<string, MediaStream>();

  private meetingId = '';
  private participantId = '';
  private fullName = '';
  private hubUrl = '';
  private token = '';

  private localStream?: MediaStream;
  private screenStream?: MediaStream;

  private participantMeta = new Map<
    string,
    {
      participantId?: string;
      fullName?: string;
      title?: number;
      email?: string;
    }
  >();

  private readonly iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

  readonly remoteStreams = signal<RemoteParticipantStream[]>([]);
  readonly messages = signal<ChatMessageModel[]>([]);
  readonly participantConnectionIds = signal<string[]>([]);
  readonly isConnected = signal(false);
  readonly isCameraOn = signal(false);
  readonly isMicOn = signal(false);
  readonly isScreenSharing = signal(false);
  readonly activeScreenShareConnectionId = signal<string | null>(null);
  readonly activeScreenShareParticipantName = signal<string>('');
  readonly canShareScreen = signal(true);
  readonly localMediaStream = signal<MediaStream | null>(null);

  readonly isTyping = signal(false);
  readonly typingUserName = signal('');
  private typingTimeout: any = null;

  async init(
    hubUrl: string,
    token: string,
    meetingId: string,
    participantId: string,
    fullName: string,
  ) {
    this.hubUrl = hubUrl;
    this.token = token;
    this.meetingId = meetingId;
    this.participantId = participantId;
    this.fullName = fullName;

    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    this.registerHubEvents();

    await this.hub.start();
    this.isConnected.set(true);

    await this.hub.invoke('JoinMeeting', this.meetingId);
    await this.hub.invoke('RegisterParticipant', this.meetingId, this.participantId);
  }

  private registerHubEvents() {
    this.hub.on('userTyping', (payload: any) => {
      const participantId = payload?.participantId ?? payload?.ParticipantId;
      const fullName = payload?.fullName ?? payload?.FullName ?? 'Katılımcı';

      if (participantId === this.participantId) return;

      this.typingUserName.set(fullName);
      this.isTyping.set(true);

      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }

      this.typingTimeout = setTimeout(() => {
        this.isTyping.set(false);
        this.typingUserName.set('');
      }, 1500);
    });

    this.hub.on('participantJoined', async (payload: any) => {
      const connectionId = payload?.connectionId ?? payload?.ConnectionId;
      if (!connectionId) return;

      this.participantMeta.set(connectionId, {
        participantId: payload?.participantId ?? payload?.ParticipantId,
        fullName: payload?.fullName ?? payload?.FullName,
        title: payload?.title ?? payload?.Title,
        email: payload?.email ?? payload?.Email,
      });

      await this.onParticipantJoined(connectionId);
    });

    this.hub.on('participantLeft', (payload: any) => {
      this.onParticipantLeft(payload);
    });

    this.hub.on('offer', async (fromConnectionId: string, sdp: string) => {
      await this.onOffer(fromConnectionId, sdp);
    });

    this.hub.on('answer', async (fromConnectionId: string, sdp: string) => {
      await this.onAnswer(fromConnectionId, sdp);
    });

    this.hub.on('ice', async (fromConnectionId: string, candidate: string) => {
      await this.onIce(fromConnectionId, candidate);
    });

    this.hub.on('participantList', (list: any[]) => {
      const ids: string[] = [];

      for (const item of list ?? []) {
        const connectionId = item?.connectionId ?? item?.ConnectionId;
        if (!connectionId) continue;

        ids.push(connectionId);

        this.participantMeta.set(connectionId, {
          participantId: item?.participantId ?? item?.ParticipantId,
          fullName: item?.fullName ?? item?.FullName,
          title: item?.title ?? item?.Title,
          email: item?.email ?? item?.Email,
        });
      }

      this.participantConnectionIds.set(ids);
      this.emitRemoteStreams();
    });

    this.hub.on('commentList', (comments: any) => {
      if (!Array.isArray(comments)) return;

      const list: ChatMessageModel[] = comments
        .map((item) => ({
          id: item?.id ?? item?.Id,
          meetingId: item?.meetingId ?? item?.MeetingId,
          participantId: item?.participantId ?? item?.ParticipantId,
          fullName: item?.participantFullName ?? item?.ParticipantFullName,
          text: item?.text ?? item?.Text ?? '',
          createdAt: item?.createdAt ?? item?.CreatedAt,
        }))
        .sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return da - db;
        });

      this.messages.set(list);
    });

    this.hub.on('newMessageNotification', (payload: any) => {
      const fullName = payload?.fullName ?? payload?.FullName ?? 'Katılımcı';

      this.#toast.showToast(
        fullName,
        `Yeni mesaj: ${payload?.message?.slice(0, 30) ?? ''}`,
        'info',
      );
    });

    this.hub.onreconnecting(() => {
      this.isConnected.set(false);
    });

    this.hub.onreconnected(async () => {
      this.isConnected.set(true);

      if (this.meetingId && this.participantId) {
        await this.hub.invoke('JoinMeeting', this.meetingId);
        await this.hub.invoke('RegisterParticipant', this.meetingId, this.participantId);
        await this.loadCommentList(this.meetingId);
      }
    });

    this.hub.on('screenSharePermissionChanged', (payload: any) => {
      const participantId = payload?.participantId ?? payload?.ParticipantId;
      const allow = payload?.allow ?? payload?.Allow;

      if (participantId === this.participantId) {
        this.canShareScreen.set(allow);

        this.#toast.showToast(
          'Bilgi',
          allow ? 'Ekran paylaşım izni verildi' : 'Ekran paylaşım izni kaldırıldı',
          allow ? 'success' : 'warning',
        );
      }
    });

    this.hub.on('screenShareStarted', (payload: any) => {
      const connectionId = payload?.connectionId ?? payload?.ConnectionId;
      const fullName = payload?.participantFullName ?? payload?.ParticipantFullName;

      this.activeScreenShareConnectionId.set(connectionId);
      this.activeScreenShareParticipantName.set(fullName);
    });

    this.hub.on('screenShareStopped', (payload: any) => {
      const connectionId = payload?.connectionId ?? payload?.ConnectionId;

      if (this.activeScreenShareConnectionId() === connectionId) {
        this.activeScreenShareConnectionId.set(null);
        this.activeScreenShareParticipantName.set('');
      }
    });

    this.hub.onclose(() => {
      this.isConnected.set(false);
    });
  }

  async notifyTyping(meetingId: string) {
    if (!this.hub || this.hub.state !== signalR.HubConnectionState.Connected) return;

    await this.hub.invoke('NotifyTyping', meetingId);
  }

  async startLocalCamera() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // videoElement.srcObject = this.localStream;
      // videoElement.muted = true;
      // await videoElement.play();

      this.localMediaStream.set(this.localStream);
      this.isCameraOn.set(true);
      this.isMicOn.set(true);
    } catch (err: any) {
      console.error('Kamera hatası:', err);

      if (err.name === 'NotReadableError') {
        alert('Kamera başka bir uygulama tarafından kullanılıyor.');
      } else if (err.name === 'NotAllowedError') {
        alert('Kamera izni verilmedi.');
      } else {
        alert('Kamera başlatılamadı.');
      }
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localMediaStream();
  }

  private async createPeerConnection(targetConnectionId: string) {
    if (!this.localMediaStream()) {
      throw new Error('Local stream başlatılmadan peer connection oluşturulamaz.');
    }

    const existing = this.pcs.get(targetConnectionId);
    if (existing) {
      return existing;
    }

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });

    this.localMediaStream()
      ?.getTracks()
      .forEach((track) => {
        pc.addTrack(track, this.localMediaStream()!);
      });

    const remoteStream = new MediaStream();
    this.remoteStreamsMap.set(targetConnectionId, remoteStream);

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        const alreadyExists = remoteStream.getTracks().some((t) => t.id === track.id);
        if (!alreadyExists) {
          remoteStream.addTrack(track);
        }
      });

      this.emitRemoteStreams();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.hub.invoke(
          'SendIce',
          this.meetingId,
          targetConnectionId,
          JSON.stringify(event.candidate),
        );
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'closed'
      ) {
        this.closePeer(targetConnectionId);
      }
    };

    this.pcs.set(targetConnectionId, pc);
    return pc;
  }

  private emitRemoteStreams() {
    const list: RemoteParticipantStream[] = [];

    for (const [connectionId, stream] of this.remoteStreamsMap.entries()) {
      const meta = this.participantMeta.get(connectionId);

      list.push({
        connectionId,
        participantId: meta?.participantId,
        fullName: meta?.fullName,
        title: meta?.title,
        email: meta?.email,
        stream,
      });
    }

    this.remoteStreams.set(list);
  }

  private async onParticipantJoined(targetConnectionId: string) {
    const currentConnectionId = this.hub.connectionId;
    if (!targetConnectionId || targetConnectionId === currentConnectionId) return;

    const pc = await this.createPeerConnection(targetConnectionId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await this.hub.invoke('SendOffer', this.meetingId, targetConnectionId, offer.sdp);
  }

  private async onOffer(fromConnectionId: string, sdp: string) {
    const pc = await this.createPeerConnection(fromConnectionId);

    await pc.setRemoteDescription(
      new RTCSessionDescription({
        type: 'offer',
        sdp,
      }),
    );

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await this.hub.invoke('SendAnswer', this.meetingId, fromConnectionId, answer.sdp);
  }

  private async onAnswer(fromConnectionId: string, sdp: string) {
    const pc = this.pcs.get(fromConnectionId);
    if (!pc) return;

    await pc.setRemoteDescription(
      new RTCSessionDescription({
        type: 'answer',
        sdp,
      }),
    );
  }

  private async onIce(fromConnectionId: string, candidateJson: string) {
    const pc = this.pcs.get(fromConnectionId);
    if (!pc) return;

    const candidate = JSON.parse(candidateJson);
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private onParticipantLeft(payload: any) {
    const connectionId =
      payload?.connectionId ?? payload?.targetConnectionId ?? payload?.ConnectionId ?? payload;

    if (!connectionId) return;

    this.participantMeta.delete(connectionId);
    this.closePeer(connectionId);
  }

  async sendChatMessage(meetingId: string, fullName: string, message: string) {
    const text = message.trim();
    if (!text) return;

    await this.hub.invoke('CreateComment', meetingId, fullName, text);
  }

  async loadCommentList(meetingId: string) {
    await this.hub.invoke('BroadcastCommentList', meetingId);
    console.log('Yorum listesi güncellendi.', meetingId);
  }

  toggleMic() {
    if (!this.localStream) return;

    const audioTracks = this.localStream.getAudioTracks();
    if (!audioTracks.length) return;

    const nextEnabled = !audioTracks[0].enabled;
    audioTracks.forEach((track) => (track.enabled = nextEnabled));
    this.isMicOn.set(nextEnabled);
  }

  toggleCamera() {
    if (!this.localStream) return;

    const videoTracks = this.localStream.getVideoTracks();
    if (!videoTracks.length) return;

    const nextEnabled = !videoTracks[0].enabled;
    videoTracks.forEach((track) => (track.enabled = nextEnabled));
    this.isCameraOn.set(nextEnabled);
  }

  async startScreenShare() {
    if (!this.canShareScreen()) {
      this.#toast.showToast('Yetki yok', 'Ekran paylaşım izniniz yok', 'error');
      return;
    }

    const mediaDevicesAny = navigator.mediaDevices as any;

    this.screenStream = await mediaDevicesAny.getDisplayMedia({
      video: true,
      audio: false,
    });

    const screenTrack = this.screenStream!.getVideoTracks()[0];
    if (!screenTrack) return;

    for (const pc of this.pcs.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }
    }

    screenTrack.onended = async () => {
      await this.stopScreenShare();
    };

    await this.hub.invoke('StartScreenShare', this.meetingId);
    this.isScreenSharing.set(true);
  }

  async stopScreenShare() {
    if (!this.screenStream) return;

    const cameraTrack = this.localStream?.getVideoTracks()[0];

    for (const pc of this.pcs.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && cameraTrack) {
        await sender.replaceTrack(cameraTrack);
      }
    }

    this.screenStream.getTracks().forEach((t) => t.stop());
    this.screenStream = undefined;

    await this.hub.invoke('StopScreenShare', this.meetingId);
    this.isScreenSharing.set(false);
  }

  getCurrentConnectionId(): string | null {
    return this.hub?.connectionId ?? null;
  }

  getScreenStream(): MediaStream | null {
    return this.screenStream ?? null;
  }

  closePeer(targetConnectionId: string) {
    const pc = this.pcs.get(targetConnectionId);
    if (pc) {
      pc.close();
      this.pcs.delete(targetConnectionId);
    }

    this.remoteStreamsMap.delete(targetConnectionId);
    this.emitRemoteStreams();
  }

  async dispose() {
    for (const [connectionId] of this.pcs.entries()) {
      this.closePeer(connectionId);
    }

    this.localStream?.getTracks().forEach((track) => track.stop());
    this.screenStream?.getTracks().forEach((track) => track.stop());

    this.localStream = undefined;
    this.screenStream = undefined;

    if (this.hub) {
      await this.hub.stop();
    }

    this.isTyping.set(false);
    this.typingUserName.set('');
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.localMediaStream.set(null);
    this.remoteStreams.set([]);
    this.messages.set([]);
    this.participantConnectionIds.set([]);
    this.isConnected.set(false);
    this.isCameraOn.set(false);
    this.isMicOn.set(false);
    this.isScreenSharing.set(false);
  }
}
