import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { BreadcrumbModel } from '../../services/breadcrumb';
import Grid from '../../components/grid/grid';
import { FlexiGridModule } from 'flexi-grid';
import { Common } from '../../services/common';

import { MeetingModel } from '../../models/meeting.model';
import Add, { examTypeList } from './add/add';
import { ParticipantsComponent } from './participants/participants';

@Component({
  imports: [Grid, FlexiGridModule, ParticipantsComponent, CommonModule, Add],
  templateUrl: './meetings.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Meetings {
  readonly #common = inject(Common);

  readonly breadcrumbs = signal<BreadcrumbModel[]>([
    {
      title: 'Toplantılar',
      icon: 'bi-calendar-week',
      url: '/meetings',
      isActive: true,
    },
  ]);

  showMeetingModal = false;
  meetingModalKey = 0;

  modalMode = signal<'add' | 'edit'>('add');
  selectedMeeting = signal<MeetingModel | null>(null);

  showParticipantsModal = false;
  participantsModalKey = 0;
  selectedMeetingId = signal<string>('');
  selectedMeetingTitle = signal<string>('');

  @ViewChild('meetingsGrid') meetingsGrid!: Grid;

  openAddModal = () => {
    this.modalMode.set('add');
    this.selectedMeeting.set(null);
    this.showMeetingModal = true;
    this.meetingModalKey++;

    setTimeout(() => {
      const modalEl = document.getElementById('meetingModal');
      if (modalEl && (window as any).bootstrap) {
        const modal = new (window as any).bootstrap.Modal(modalEl);
        modal.show();
      }
    }, 50);
  };

  openEditModal = (item: MeetingModel) => {
    this.modalMode.set('edit');
    this.selectedMeeting.set({ ...item });
    this.showMeetingModal = true;
    this.meetingModalKey++;

    setTimeout(() => {
      const modalEl = document.getElementById('meetingModal');
      if (modalEl && (window as any).bootstrap) {
        const modal = new (window as any).bootstrap.Modal(modalEl);
        modal.show();
      }
    }, 50);
  };

  closeMeetingModal() {
    const modalEl = document.getElementById('meetingModal');

    if (modalEl && (window as any).bootstrap) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        modal.hide();
      }
    }

    setTimeout(() => {
      this.showMeetingModal = false;
      this.modalMode.set('add');
      this.selectedMeeting.set(null);
      this.meetingModalKey++;

      if (this.meetingsGrid?.result) {
        this.meetingsGrid.result.reload();
      }
    }, 300);
  }

  openParticipantsModal = (item: MeetingModel) => {
    this.selectedMeetingId.set(item.id ?? '');
    this.selectedMeetingTitle.set(item.title ?? '');
    this.showParticipantsModal = true;
    this.participantsModalKey++;

    setTimeout(() => {
      const modalEl = document.getElementById('participantsModal');
      if (modalEl && (window as any).bootstrap) {
        const modal = new (window as any).bootstrap.Modal(modalEl);
        modal.show();
      }
    }, 50);
  };

  closeParticipantsModal() {
    const modalEl = document.getElementById('participantsModal');

    if (modalEl && (window as any).bootstrap) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }

    setTimeout(() => {
      this.showParticipantsModal = false;
      this.selectedMeetingId.set('');
      this.selectedMeetingTitle.set('');
      this.participantsModalKey++;
    }, 300);
  }

  getExamTypeLabel(examType: number): string {
    const examTypeOption = examTypeList.find((option) => option.value == examType);
    return examTypeOption ? examTypeOption.label : 'Bilinmeyen';
  }

  checkPermission(permission: string) {
    return this.#common.checkPermission(permission);
  }
}
