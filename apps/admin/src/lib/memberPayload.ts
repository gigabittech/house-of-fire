export type MemberRole = 'member' | 'crew' | 'admin';

export interface MemberSettings {
  photographer?: boolean;
  flagged?: boolean;
  [key: string]: unknown;
}

export interface MemberRecord {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  member_since: string;
  role: MemberRole;
  settings: MemberSettings | null;
  email: string | null;
  ticket_count?: number;
  post_count?: number;
  last_edition?: number | null;
  latest_tier_name?: string | null;
}

export interface MemberUpdatePayload {
  display_name?: string;
  handle?: string;
  email?: string;
  role?: MemberRole;
  photographer?: boolean;
  flagged?: boolean;
}

const HANDLE_RE = /^[a-z0-9_]{3,32}$/;

export function normalizeHandle(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export function validateMemberUpdate(body: MemberUpdatePayload): string | null {
  if (body.display_name !== undefined && !body.display_name.trim()) {
    return 'Display name is required';
  }
  if (body.handle !== undefined) {
    const handle = normalizeHandle(body.handle);
    if (!HANDLE_RE.test(handle)) {
      return 'Handle must be 3–32 characters (letters, numbers, underscore)';
    }
  }
  if (body.email !== undefined && body.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return 'Enter a valid email address';
  }
  if (body.role !== undefined && !['member', 'crew', 'admin'].includes(body.role)) {
    return 'Invalid role';
  }
  return null;
}

export function mergeMemberSettings(
  current: MemberSettings | null,
  updates: { photographer?: boolean; flagged?: boolean },
): MemberSettings {
  const next: MemberSettings = { ...(current ?? {}) };
  if (updates.photographer !== undefined) next.photographer = updates.photographer;
  if (updates.flagged !== undefined) next.flagged = updates.flagged;
  return next;
}
