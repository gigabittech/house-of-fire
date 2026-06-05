import type { IconName } from './Icon';
import type { NavId } from './HofBottomNav';

export type NavId = 'home' | 'events' | 'community' | 'profile';

export interface MemberNavItem {
  id: NavId;
  label: string;
  icon: IconName;
}

/** Member app primary nav — filter with `filterMemberNavItems` when gating Community. */
export const MEMBER_NAV_ITEMS: MemberNavItem[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'events', label: 'Events', icon: 'calendar' },
  { id: 'community', label: 'Community', icon: 'chat' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

export function filterMemberNavItems(excludeNavIds: NavId[] = []): MemberNavItem[] {
  if (excludeNavIds.length === 0) return MEMBER_NAV_ITEMS;
  return MEMBER_NAV_ITEMS.filter((item) => !excludeNavIds.includes(item.id));
}
