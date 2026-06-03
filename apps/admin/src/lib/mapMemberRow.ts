import { daysSince, formatJoined } from '@/lib/formatters';

export interface MemberRow {
  id: string;
  name: string;
  email: string;
  tier: string;
  role: 'member' | 'crew';
  joined: string;
  editions: number;
  lastSeen: string;
  posts: number;
  flag: '' | 'new' | 'flagged' | 'photographer';
}

export interface MemberApiPayload {
  id: string;
  handle: string;
  display_name: string;
  member_since: string;
  role: 'member' | 'crew' | 'admin';
  settings: Record<string, unknown> | null;
  ticket_count: number;
  post_count: number;
  last_edition: number | null;
  latest_tier_name: string | null;
}

export function mapMemberRow(m: MemberApiPayload): MemberRow {
  const settings = m.settings ?? {};
  let flag: MemberRow['flag'] = '';
  if (settings['flagged'] === true) flag = 'flagged';
  else if (settings['photographer'] === true) flag = 'photographer';
  else if (daysSince(m.member_since) < 14) flag = 'new';

  let tier = m.latest_tier_name ?? 'GA';
  if (m.role === 'admin') tier = 'Owner';
  else if (m.role === 'crew' && tier === 'GA') tier = 'Crew';

  const lastSeen = m.last_edition != null ? `Ed ${m.last_edition}` : '—';

  return {
    id: m.id,
    name: m.display_name,
    email: `${m.handle}@…`,
    tier,
    role: m.role === 'crew' || m.role === 'admin' ? 'crew' : 'member',
    joined: formatJoined(m.member_since),
    editions: m.ticket_count,
    lastSeen,
    posts: m.post_count,
    flag,
  };
}
