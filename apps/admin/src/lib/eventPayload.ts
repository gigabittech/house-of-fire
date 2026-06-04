import type { Json } from '@/lib/database.types';

export type EventStatus = 'upcoming' | 'live' | 'past' | 'cancelled';

export interface EventFaq {
  q: string;
  a: string;
}

export interface EventFormPayload {
  edition_number: number;
  name: string;
  tagline: string | null;
  date: string;
  doors_open: string;
  doors_close: string;
  venue_name: string;
  venue_address: string;
  venue_lat: number | null;
  venue_lng: number | null;
  /** Derived from tier capacities; stored on events for reporting. */
  capacity: number;
  max_tickets_per_user: number;
  status: EventStatus;
  hero_image_url: string | null;
  faqs: EventFaq[];
}

const STATUSES: EventStatus[] = ['upcoming', 'live', 'past', 'cancelled'];

function normalizeTime(raw: string): string | null {
  const t = raw.trim();
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(t);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseFaqs(raw: unknown): EventFaq[] | null {
  if (!Array.isArray(raw)) return [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) return null;
    const o = item as Record<string, unknown>;
    if (typeof o.q !== 'string' || typeof o.a !== 'string') return null;
  }
  return (raw as EventFaq[]).map((f) => ({ q: f.q.trim(), a: f.a.trim() }));
}

function parseOptionalNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseEventPayload(
  body: unknown,
  options?: { partial?: boolean },
): { ok: true; data: Partial<EventFormPayload> } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Invalid JSON body' };
  }
  const b = body as Record<string, unknown>;
  const partial = options?.partial ?? false;
  const out: Partial<EventFormPayload> = {};

  if (b.edition_number !== undefined) {
    const n = Number(b.edition_number);
    if (!Number.isInteger(n) || n < 1) return { ok: false, error: 'Invalid edition number' };
    out.edition_number = n;
  } else if (!partial) {
    return { ok: false, error: 'edition_number is required' };
  }

  if (b.name !== undefined) {
    const name = String(b.name).trim();
    if (!name) return { ok: false, error: 'name is required' };
    out.name = name;
  } else if (!partial) {
    return { ok: false, error: 'name is required' };
  }

  if (b.tagline !== undefined) {
    out.tagline = b.tagline === null || b.tagline === '' ? null : String(b.tagline).trim();
  }

  if (b.date !== undefined) {
    const date = String(b.date).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'Invalid date' };
    out.date = date;
  } else if (!partial) {
    return { ok: false, error: 'date is required' };
  }

  if (b.doors_open !== undefined) {
    const t = normalizeTime(String(b.doors_open));
    if (!t) return { ok: false, error: 'Invalid doors_open time' };
    out.doors_open = t;
  } else if (!partial) {
    out.doors_open = '20:00';
  }

  if (b.doors_close !== undefined) {
    const t = normalizeTime(String(b.doors_close));
    if (!t) return { ok: false, error: 'Invalid doors_close time' };
    out.doors_close = t;
  } else if (!partial) {
    out.doors_close = '02:00';
  }

  if (b.venue_name !== undefined) {
    const v = String(b.venue_name).trim();
    if (!v) return { ok: false, error: 'venue_name is required' };
    out.venue_name = v;
  } else if (!partial) {
    return { ok: false, error: 'venue_name is required' };
  }

  if (b.venue_address !== undefined) {
    const v = String(b.venue_address).trim();
    if (!v) return { ok: false, error: 'venue_address is required' };
    out.venue_address = v;
  } else if (!partial) {
    return { ok: false, error: 'venue_address is required' };
  }

  if (b.venue_lat !== undefined) out.venue_lat = parseOptionalNumber(b.venue_lat);
  if (b.venue_lng !== undefined) out.venue_lng = parseOptionalNumber(b.venue_lng);

  if (b.capacity !== undefined) {
    const n = Number(b.capacity);
    if (!Number.isInteger(n) || n < 0) return { ok: false, error: 'Invalid capacity' };
    out.capacity = n;
  } else if (!partial) {
    out.capacity = 0;
  }

  if (b.max_tickets_per_user !== undefined) {
    const n = Number(b.max_tickets_per_user);
    if (!Number.isInteger(n) || n < 1 || n > 20) {
      return { ok: false, error: 'Max tickets per account must be 1–20' };
    }
    out.max_tickets_per_user = n;
  } else if (!partial) {
    out.max_tickets_per_user = 4;
  }

  if (b.status !== undefined) {
    const s = String(b.status) as EventStatus;
    if (!STATUSES.includes(s)) return { ok: false, error: 'Invalid status' };
    out.status = s;
  } else if (!partial) {
    out.status = 'upcoming';
  }

  if (b.hero_image_url !== undefined) {
    out.hero_image_url =
      b.hero_image_url === null || b.hero_image_url === ''
        ? null
        : String(b.hero_image_url).trim();
  }

  if (b.faqs !== undefined) {
    const faqs = parseFaqs(b.faqs);
    if (faqs === null) return { ok: false, error: 'Invalid faqs format' };
    out.faqs = faqs;
  } else if (!partial) {
    out.faqs = [];
  }

  return { ok: true, data: out };
}

export function eventFormPayloadToInsert(data: EventFormPayload) {
  return {
    edition_number: data.edition_number,
    name: data.name,
    tagline: data.tagline,
    date: data.date,
    doors_open: data.doors_open,
    doors_close: data.doors_close,
    venue_name: data.venue_name,
    venue_address: data.venue_address,
    venue_lat: data.venue_lat,
    venue_lng: data.venue_lng,
    capacity: data.capacity,
    max_tickets_per_user: data.max_tickets_per_user,
    status: data.status,
    hero_image_url: data.hero_image_url,
    faqs: data.faqs as unknown as Json,
  };
}

export const DEFAULT_EVENT_FORM: EventFormPayload = {
  edition_number: 1,
  name: '',
  tagline: null,
  date: new Date().toISOString().slice(0, 10),
  doors_open: '20:00',
  doors_close: '02:00',
  venue_name: 'Junkyard Social Club',
  venue_address: 'Boulder, CO',
  venue_lat: null,
  venue_lng: null,
  capacity: 0,
  max_tickets_per_user: 4,
  status: 'upcoming',
  hero_image_url: null,
  faqs: [],
};
