import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { BreadcrumbModel } from '../../services/breadcrumb';
import Grid from '../../components/grid/grid';
import { FlexiGridModule } from 'flexi-grid';
import { RouterLink } from '@angular/router';
import { Common } from '../../services/common';
import { examTypeList } from '../meetings/add/add';
import { AddMeetingComponent } from './add-modal.component';
import { CommonModule } from '@angular/common';

@Component({
  imports: [Grid, FlexiGridModule, RouterLink, AddMeetingComponent, CommonModule],
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

  showAddModal = false;
  addModalKey = 0;
  // Grid referansı
  @ViewChild('meetingsGrid') meetingsGrid!: Grid;

  openAddModal() {
    this.addModalKey++;
    this.showAddModal = true;
    setTimeout(() => {
      const modalEl = document.querySelector('.modal');
      if (modalEl && (window as any).bootstrap) {
        // @ts-ignore
        const modal = new (window as any).bootstrap.Modal(modalEl);
        modal.show();
      }
    }, 50);
  }
  closeAddModal() {
    this.showAddModal = false;
    const modalEl = document.querySelector('.modal');
    setTimeout(() => {
      if (modalEl && (window as any).bootstrap) {
        const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
        if (modal) {
          modal.hide();
        }
      }
      // Toplantı listesini yenile
      if (this.meetingsGrid && this.meetingsGrid.result) {
        this.meetingsGrid.result.reload();
      }
    }, 1000);
  }

  getExamTypeLabel(examType: number): string {
    const examTypeOption = examTypeList.find((option) => option.value == examType);
    return examTypeOption ? examTypeOption.label : 'Bilinmeyen';
  }

  checkPermission(permission: string) {
    return this.#common.checkPermission(permission);
  }
}
