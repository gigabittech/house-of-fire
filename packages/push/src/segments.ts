import type { PushSegment } from './types';

export const PUSH_SEGMENTS: Array<{ value: PushSegment; label: string; requiresEvent: boolean }> = [
  { value: 'all_members', label: 'All members', requiresEvent: false },
  { value: 'event_attendees', label: 'Event attendees', requiresEvent: true },
  { value: 'vip_members', label: 'VIP members', requiresEvent: false },
];

export function parsePushSegment(raw: unknown): PushSegment | null {
  if (raw === 'all_members' || raw === 'event_attendees' || raw === 'vip_members') {
    return raw;
  }
  return null;
}

export function segmentRequiresEvent(segment: PushSegment): boolean {
  return segment === 'event_attendees';
}
