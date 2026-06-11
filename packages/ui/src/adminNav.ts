import type { IconName } from './Icon';

export type AdminNavId =
  | 'dashboard'
  | 'events'
  | 'guests'
  | 'door'
  | 'media'
  | 'members'
  | 'mod'
  | 'announce'
  | 'push'
  | 'email-log'
  | 'codes'
  | 'financials';

export interface AdminNavItem {
  id: AdminNavId;
  label: string;
  icon: IconName;
}

/** Admin dashboard sidebar — same nav model as member `MEMBER_NAV_ITEMS`. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'chart' },
  { id: 'events', label: 'Events', icon: 'calendar' },
  { id: 'guests', label: 'Guest list', icon: 'users' },
  { id: 'door', label: 'Door', icon: 'qr' },
  { id: 'media', label: 'Photo review', icon: 'image' },
  { id: 'members', label: 'Members', icon: 'user' },
  { id: 'mod', label: 'Moderation', icon: 'flag' },
  { id: 'announce', label: 'Announcements', icon: 'bell' },
  { id: 'push', label: 'Push', icon: 'bolt' },
  { id: 'email-log', label: 'Email log', icon: 'mail' },
  { id: 'codes', label: 'Codes & comps', icon: 'tag' },
  { id: 'financials', label: 'Financials', icon: 'wallet' },
];
