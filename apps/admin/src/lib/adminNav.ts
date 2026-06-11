import type { AdminNavId } from '@hof/ui';

export const ADMIN_NAV_HREF: Record<AdminNavId, string> = {
  dashboard: '/dashboard',
  events: '/events',
  guests: '/guests',
  door: '/door',
  media: '/media',
  members: '/members',
  mod: '/mod',
  announce: '/announce',
  push: '/push',
  'email-log': '/email-log',
  codes: '/codes',
  financials: '/financials',
};

export function adminNavIdFromPath(pathname: string): AdminNavId | undefined {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'dashboard';
  if (pathname === '/events' || pathname.startsWith('/events/')) return 'events';
  if (pathname === '/guests' || pathname.startsWith('/guests/')) return 'guests';
  if (pathname === '/door' || pathname.startsWith('/door/')) return 'door';
  if (pathname === '/media' || pathname.startsWith('/media/')) return 'media';
  if (pathname === '/members' || pathname.startsWith('/members/')) return 'members';
  if (pathname === '/mod' || pathname.startsWith('/mod/')) return 'mod';
  if (pathname === '/announce' || pathname.startsWith('/announce/')) return 'announce';
  if (pathname === '/push' || pathname.startsWith('/push/')) return 'push';
  if (pathname === '/email-log' || pathname.startsWith('/email-log/')) return 'email-log';
  if (pathname === '/codes' || pathname.startsWith('/codes/')) return 'codes';
  if (pathname === '/financials' || pathname.startsWith('/financials/')) return 'financials';
  return undefined;
}

export function adminPageTitle(pathname: string): string {
  const id = adminNavIdFromPath(pathname);
  const titles: Record<AdminNavId, string> = {
    dashboard: 'Dashboard',
    events: 'Events',
    guests: 'Guest list',
    door: 'Door',
    media: 'Photo review',
    members: 'Members',
    mod: 'Moderation',
    announce: 'Announcements',
    push: 'Push',
    'email-log': 'Email log',
    codes: 'Codes & comps',
    financials: 'Financials',
  };
  return id ? titles[id] : 'Admin';
}
