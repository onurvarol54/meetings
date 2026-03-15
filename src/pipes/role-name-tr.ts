import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleNameTr',
})
export class RoleNameTrPipe implements PipeTransform {
  private readonly roleNameTrMap: Record<string, string> = {
    faculty_secretary: 'Fakülte Sekreteri',
    department_secretary: 'Bölüm Sekreteri',
    manager: 'Yönetici',
    sys_admin: 'Sistem Yöneticisi',
    quality_officer: 'Kalite Temsilcisi',
    coordination_member: 'Koordinasyon Üyesi',
    department_head: 'Daire Başkanı',
  };
  transform(name?: string | null): string {
    if (!name) return '';

    const tr = this.roleNameTrMap[name];
    if (tr) return tr;

    return name
      .split('_')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
}
