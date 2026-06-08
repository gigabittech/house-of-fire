import type { EventStatus } from '@/lib/eventPayload';
import { formatEventListDate, formatGross } from '@/lib/formatters';

export interface EventRow {
  id: string;
  ed: number;
  name: string;
  date: string;
  status: 'live' | 'draft' | 'past';
  rawStatus: EventStatus;
  sold: number;
  cap: number;
  gross: string;
}

export interface EventWithStats {
  id: string;
  edition_number: number;
  name: string;
  date: string;
  status: 'upcoming' | 'live' | 'past' | 'cancelled';
  capacity: number;
  sold: number;
  gross_cents: number;
}

export function mapEventStatus(status: EventWithStats['status']): 'live' | 'draft' | 'past' {
  if (status === 'live') return 'live';
  if (status === 'upcoming') return 'draft';
  return 'past';
}

export function mapEventRow(ev: EventWithStats): EventRow {
  return {
    id: ev.id,
    ed: ev.edition_number,
    name: ev.name,
    date: formatEventListDate(ev.date),
    status: mapEventStatus(ev.status),
    rawStatus: ev.status,
    sold: ev.sold,
    cap: ev.capacity,
    gross: formatGross(ev.gross_cents),
  };
}
