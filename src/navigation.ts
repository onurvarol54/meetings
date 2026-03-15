export interface NavigationModel {
  title: string;
  url?: string;
  icon?: string;
  haveSubmenu?: boolean;
  subMenus?: NavigationModel[];
  permission: string;
}
export const navigations: NavigationModel[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: 'bi-speedometer2',
    permission: 'dashboard:view',
  },
  {
    title: 'Toplantılar',
    url: '/meetings',
    icon: 'bi-calendar-event',
    permission: 'meeting:view',
  },
  {
    title: 'Roller',
    url: '/roles',
    icon: 'bi-clipboard2-check',
    permission: 'role:view',
  },
  {
    title: 'Kullanıcılar',
    url: '/users',
    icon: 'bi-people',
    permission: 'user:view',
  },
];
