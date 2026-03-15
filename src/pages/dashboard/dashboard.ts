import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { httpResource } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BreadcrumbService } from '../../services/breadcrumb';
import Blank from '../../components/blank/blank';
import { RouterLink } from '@angular/router';
import { Common } from '../../services/common';

@Component({
  imports: [Blank, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Dashboard implements OnInit {
  readonly #breadcrumb = inject(BreadcrumbService);
  readonly #common = inject(Common);

  ngOnInit(): void {
    this.#breadcrumb.setDashboard();
  }

  checkPermission(permission: string) {
    return this.#common.checkPermission(permission);
  }
}
