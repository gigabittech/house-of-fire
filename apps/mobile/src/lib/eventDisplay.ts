export const NO_EVENTS_MESSAGE = 'There are currently no events available.';

export interface UpcomingTier {
  id: string;
  name: string;
  display_name?: string | null;
  description?: string | null;
  price_cents: number;
  fee_cents?: number;
  capacity: number;
  sold?: number;
  remaining?: number;
  status?: 'available' | 'sold_out' | 'hidden';
  effective_status?: 'available' | 'sold_out' | 'hidden';
}

export interface UpcomingEvent {
  id: string;
  edition_number: number;
  name: string;
  date: string;
  doors_open?: string;
  doors_close?: string;
  venue_name: string;
  venue_address?: string;
  tagline?: string | null;
  capacity?: number;
  max_tickets_per_user?: number;
  user_ticket_count?: number;
  user_tickets_remaining?: number;
  hero_image_url?: string | null;
  faqs?: Array<{ q: string; a: string }>;
  ticket_tiers?: UpcomingTier[];
}

const TIME_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/** Normalize Postgres `time` (`20:00:00`) or HTML input (`20:00`) to `HH:mm`. */
export function normalizeEventTime(raw: string | null | undefined): string {
  if (!raw) return '20:00';
  const match = TIME_RE.exec(raw.trim());
  if (!match) return '20:00';
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return '20:00';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDoorsTime(raw: string | null | undefined): string {
  const time = normalizeEventTime(raw);
  const [h, m] = time.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: m === 0 ? undefined : '2-digit',
  });
}

export function formatDoorsRange(
  open: string | null | undefined,
  close?: string | null | undefined,
): string {
  const openFmt = formatDoorsTime(open);
  if (!close) return openFmt;
  return `${openFmt} — ${formatDoorsTime(close)}`;
}

/** Local wall-clock timestamp for event doors on the given date. */
export function eventDoorsTimestamp(dateStr: string, doorsOpen?: string | null): number {
  const time = normalizeEventTime(doorsOpen);
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  if (!y || !mo || !d) return Number.NaN;
  return new Date(y, mo - 1, d, hh, mm, 0, 0).getTime();
}

export function countdownParts(targetMs: number, nowMs: number = Date.now()) {
  if (!Number.isFinite(targetMs)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, valid: false as const };
  }
  const ms = Math.max(0, targetMs - nowMs);
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
    valid: true as const,
  };
}

export function formatEventDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatEventDateLong(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatEventDateShort(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

export function formatVenueLine(
  event: Pick<UpcomingEvent, 'venue_name' | 'doors_open' | 'doors_close'>,
): string {
  if (event.doors_open && event.doors_close) {
    return `${event.venue_name} · Doors ${formatDoorsRange(event.doors_open, event.doors_close)}`;
  }
  if (event.doors_open) {
    return `${event.venue_name} · Doors ${formatDoorsTime(event.doors_open)}`;
  }
  return event.venue_name;
}

export function remainingTickets(tiers: UpcomingTier[] | undefined): number {
  if (!tiers?.length) return 0;
  return tiers.reduce((sum, t) => {
    const rem = t.remaining ?? Math.max(0, t.capacity - (t.sold ?? 0));
    return sum + rem;
  }, 0);
}

export function totalTicketsSold(tiers: UpcomingTier[] | undefined): number {
  if (!tiers?.length) return 0;
  return tiers.reduce((sum, t) => sum + (t.sold ?? 0), 0);
}

export function formatCapacityMeta(capacity: number, sold: number): string {
  if (capacity <= 0) return `${sold} sold`;
  const pct = Math.min(100, Math.round((sold / capacity) * 100));
  return `${capacity} cap · ${sold} sold (${pct}%)`;
}

export function parseEventFaqs(raw: unknown): Array<{ q: string; a: string }> {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is { q: string; a: string } =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { q: unknown }).q === 'string' &&
      typeof (item as { a: unknown }).a === 'string',
  );
}

export function editionLabel(event: Pick<UpcomingEvent, 'name' | 'edition_number'>): string {
  return `${event.name} · Theme ${event.edition_number}`;
}

export const DEFAULT_EVENT_HERO = '/assets/photos/p1-laser-dj.jpg';

export function resolveEventHeroImage(
  heroImageUrl: string | null | undefined,
  fallback = DEFAULT_EVENT_HERO,
): string {
  const url = heroImageUrl?.trim();
  return url || fallback;
}

export interface CalendarEventData {
  title: string;
  starts: string;
  ends: string;
  location: string;
  details: string;
}

export function buildCalendarEventData(
  event: Pick<
    UpcomingEvent,
    | 'name'
    | 'edition_number'
    | 'date'
    | 'doors_open'
    | 'doors_close'
    | 'venue_name'
    | 'venue_address'
    | 'tagline'
  >,
): CalendarEventData {
  const open = normalizeEventTime(event.doors_open);
  const close = normalizeEventTime(event.doors_close ?? '02:00');
  const [y, mo, d] = event.date.split('-').map(Number);
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);

  if (!y || !mo || !d) {
    return {
      title: `House of Fire — ${event.name} (Th. ${event.edition_number})`,
      starts: new Date().toISOString(),
      ends: new Date(Date.now() + 5 * 3600000).toISOString(),
      location: event.venue_name,
      details: event.tagline ?? 'houseoffire.events',
    };
  }

  const start = new Date(y, mo - 1, d, oh, om, 0);
  const end = new Date(y, mo - 1, d, ch, cm, 0);
  if (end <= start) end.setDate(end.getDate() + 1);

  const location = event.venue_address
    ? `${event.venue_name}, ${event.venue_address}`
    : event.venue_name;

  return {
    title: `House of Fire — ${event.name} (Th. ${event.edition_number})`,
    starts: start.toISOString(),
    ends: end.toISOString(),
    location,
    details: [event.tagline, `Doors ${formatDoorsTime(open)}`, 'houseoffire.events']
      .filter(Boolean)
      .join('. '),
  };
}
