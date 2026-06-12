import type { EventTierStatusGroup } from '@/app/api/admin/guests/status/route';
import { updateById } from '@hof/realtime';
import type { AdminGuestTicket } from '@/lib/guestTicket';

export type TicketRealtimeRow = {
  id: string;
  event_id?: string;
  tier_id?: string;
  status?: string;
  source?: string | null;
  stripe_charge_id?: string | null;
  amount_cents?: number;
  checked_in_at?: string | null;
  used_at?: string | null;
  purchased_at?: string;
};

export type TierRealtimeRow = {
  id: string;
  event_id?: string;
  sold_count?: number;
  capacity?: number;
  display_name?: string;
  name?: string;
  status?: string;
};

export function isWalkupTicket(row: {
  source?: string | null;
  stripe_charge_id?: string | null;
}): boolean {
  return row.source === 'door' || (row.stripe_charge_id ?? '').startsWith('door-');
}

export function isSoldTicketStatus(status?: string): boolean {
  return status === 'valid' || status === 'used';
}

export function patchTierStatusGroups(
  groups: EventTierStatusGroup[],
  tierRow: TierRealtimeRow,
): EventTierStatusGroup[] {
  const sold = Math.max(0, tierRow.sold_count ?? 0);
  const capacity = tierRow.capacity ?? 0;
  return groups.map((group) => {
    if (group.event_id !== tierRow.event_id) return group;
    return {
      ...group,
      tiers: group.tiers.map((t) =>
        t.tier_id === tierRow.id
          ? {
              ...t,
              sold,
              remaining: Math.max(0, capacity - sold),
              tier_status: tierRow.status ?? t.tier_status,
            }
          : t,
      ),
    };
  });
}

export function patchTierStatusOnTicketDelta(
  groups: EventTierStatusGroup[],
  tierId: string,
  eventId: string,
  delta: number,
): EventTierStatusGroup[] {
  return groups.map((group) => {
    if (group.event_id !== eventId) return group;
    return {
      ...group,
      tiers: group.tiers.map((t) => {
        if (t.tier_id !== tierId) return t;
        const sold = Math.max(0, t.sold + delta);
        return { ...t, sold, remaining: Math.max(0, t.capacity - sold) };
      }),
    };
  });
}

export function patchGuestTicketRow(
  tickets: AdminGuestTicket[],
  row: TicketRealtimeRow,
): AdminGuestTicket[] {
  const idx = tickets.findIndex((t) => t.id === row.id);
  if (idx === -1) return tickets;
  const cur = tickets[idx]!;
  return updateById(tickets, row.id, {
    status: (row.status as AdminGuestTicket['status']) ?? cur.status,
    checked_in_at: row.checked_in_at !== undefined ? row.checked_in_at : cur.checked_in_at,
    used_at: row.used_at !== undefined ? row.used_at : cur.used_at,
    amount_cents: row.amount_cents ?? cur.amount_cents,
  });
}

export type EventStats = { sold: number; scanned: number; gross_cents: number };

export function patchEventStatsOnTicketInsert(
  stats: EventStats,
  row: TicketRealtimeRow,
): EventStats {
  if (!isSoldTicketStatus(row.status)) return stats;
  return {
    sold: stats.sold + 1,
    scanned: stats.scanned + (row.status === 'used' ? 1 : 0),
    gross_cents: stats.gross_cents + (row.amount_cents ?? 0),
  };
}

export function patchEventStatsOnTicketUpdate(
  stats: EventStats,
  row: TicketRealtimeRow,
  old: Partial<TicketRealtimeRow>,
): EventStats {
  let next = { ...stats };
  const wasSold = isSoldTicketStatus(old.status);
  const isSold = isSoldTicketStatus(row.status);

  if (!wasSold && isSold) {
    next = patchEventStatsOnTicketInsert(next, row);
  } else if (wasSold && !isSold) {
    next = {
      sold: Math.max(0, next.sold - 1),
      scanned: Math.max(0, next.scanned - (old.status === 'used' ? 1 : 0)),
      gross_cents: Math.max(0, next.gross_cents - (old.amount_cents ?? row.amount_cents ?? 0)),
    };
  } else if (wasSold && isSold && old.status !== 'used' && row.status === 'used') {
    next = { ...next, scanned: next.scanned + 1 };
  }
  return next;
}

export function patchTierBars(
  bars: Array<{ label: string; sold: number; cap: number }>,
  _tierId: string,
  sold: number,
  label?: string,
  cap?: number,
): Array<{ label: string; sold: number; cap: number }> {
  const idx = label ? bars.findIndex((b) => b.label === label) : -1;
  if (idx === -1 && label) {
    return [...bars, { label, sold, cap: cap ?? sold }];
  }
  return bars.map((b, i) => (i === idx ? { ...b, sold, cap: cap ?? b.cap } : b));
}

export function toDashboardGuestRow(ticket: AdminGuestTicket): {
  id: string;
  code: string;
  amount_cents: number;
  status: AdminGuestTicket['status'];
  purchased_at: string;
  profiles: { display_name: string; handle: string; avatar_url: string | null } | null;
  ticket_tiers: { display_name: string; name: string } | null;
} {
  return {
    id: ticket.id,
    code: ticket.code,
    amount_cents: ticket.amount_cents,
    status: ticket.status,
    purchased_at: ticket.purchased_at,
    profiles: ticket.profiles
      ? {
          display_name: ticket.profiles.display_name,
          handle: ticket.profiles.handle,
          avatar_url: ticket.profiles.avatar_url,
        }
      : null,
    ticket_tiers: ticket.ticket_tiers
      ? { display_name: ticket.ticket_tiers.display_name, name: ticket.ticket_tiers.name }
      : null,
  };
}

export function bumpSalesSeries(series: number[], delta = 1): number[] {
  if (series.length === 0) return [delta];
  const next = series.slice();
  next[next.length - 1] = (next[next.length - 1] ?? 0) + delta;
  return next;
}
