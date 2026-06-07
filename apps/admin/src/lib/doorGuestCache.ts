const STORAGE_PREFIX = 'hof-admin-door-guest-cache';

export type CachedGuestTicket = {
  code: string;
  status: string;
  checked_in_at: string | null;
  holder_name: string;
  tier_name: string;
};

export type GuestCachePayload = {
  eventId: string;
  fetchedAt: string;
  tickets: CachedGuestTicket[];
};

function storageKey(eventId: string): string {
  return `${STORAGE_PREFIX}:${eventId}`;
}

function readCache(eventId: string): GuestCachePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(eventId));
    if (!raw) return null;
    return JSON.parse(raw) as GuestCachePayload;
  } catch {
    return null;
  }
}

function writeCache(payload: GuestCachePayload): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(payload.eventId), JSON.stringify(payload));
}

export function normalizeTicketCode(raw: string): string {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed) as { code?: unknown };
    if (typeof parsed.code === 'string' && parsed.code.length > 0) {
      return parsed.code.toUpperCase();
    }
  } catch {
    // plain code
  }
  return trimmed.toUpperCase();
}

export async function prefetchGuestCache(
  eventId: string,
  apiPath = '/api/admin/door/guest-cache',
): Promise<GuestCachePayload | null> {
  try {
    const res = await fetch(`${apiPath}?eventId=${encodeURIComponent(eventId)}`);
    if (!res.ok) return readCache(eventId);
    const data = (await res.json()) as GuestCachePayload;
    writeCache(data);
    return data;
  } catch {
    return readCache(eventId);
  }
}

export function lookupCachedTicket(
  eventId: string,
  rawCode: string,
): CachedGuestTicket | null {
  const cache = readCache(eventId);
  if (!cache) return null;
  const code = normalizeTicketCode(rawCode);
  return cache.tickets.find((t) => t.code.toUpperCase() === code) ?? null;
}

export function markCachedTicketUsed(eventId: string, rawCode: string, checkedInAt: string): void {
  const cache = readCache(eventId);
  if (!cache) return;
  const code = normalizeTicketCode(rawCode);
  const tickets = cache.tickets.map((t) =>
    t.code.toUpperCase() === code
      ? { ...t, status: 'used', checked_in_at: checkedInAt }
      : t,
  );
  writeCache({ ...cache, tickets });
}

export function getGuestCache(eventId: string): GuestCachePayload | null {
  return readCache(eventId);
}
