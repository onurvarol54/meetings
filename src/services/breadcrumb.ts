import { Injectable, signal } from '@angular/core';

export interface BreadcrumbModel {
  title: string;
  url?: string;
  icon?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  readonly data = signal<BreadcrumbModel[]>([]);

  reset(breadcrumbs: BreadcrumbModel[]) {
    const deshboard: BreadcrumbModel = {
      title: 'Dashboard',
      url: '/',
      icon: 'bi-speedometer2',
    };
    this.data.set([{ ...deshboard }]);
    this.data.update((prev) => [...prev, ...breadcrumbs]);
  }

  setDashboard() {
    const deshboard: BreadcrumbModel = {
      title: 'Dashboard',
      url: '/',
      icon: 'bi-speedometer2',
      isActive: true,
    };
    this.data.set([{ ...deshboard }]);
  }
  set(breadcrumbs: BreadcrumbModel[]) {
    this.data.update((prev) => [...prev, ...breadcrumbs]);
  }
}
