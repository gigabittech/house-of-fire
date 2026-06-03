export interface UpcomingTier {
  id: string;
  name: string;
  display_name?: string | null;
  price_cents: number;
  capacity: number;
  sold?: number;
  remaining?: number;
}

export interface UpcomingEvent {
  id: string;
  edition_number: number;
  name: string;
  date: string;
  doors_open?: string;
  venue_name: string;
  venue_address?: string;
  tagline?: string | null;
  faqs?: Array<{ q: string; a: string }>;
  ticket_tiers?: UpcomingTier[];
}

export function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatVenueLine(event: Pick<UpcomingEvent, 'venue_name' | 'doors_open'>): string {
  if (event.doors_open) {
    return `${event.venue_name} · Doors ${event.doors_open}`;
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

export function editionLabel(event: Pick<UpcomingEvent, 'name' | 'edition_number'>): string {
  return `${event.name} · Edition ${event.edition_number}`;
}
