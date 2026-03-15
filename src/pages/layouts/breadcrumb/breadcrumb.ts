import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { BreadcrumbService } from '../../../services/breadcrumb';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  imports: [NgClass, RouterLink],
  templateUrl: './breadcrumb.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Breadcrumb {
  readonly breadcrumb = inject(BreadcrumbService);
}
