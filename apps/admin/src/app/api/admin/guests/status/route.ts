import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

const ACTIVE_TICKET = ['valid', 'used'] as const;

export type TierStatusRow = {
  tier_id: string;
  name: string;
  display_name: string;
  capacity: number;
  sold: number;
  remaining: number;
  tier_status: string;
};

export type EventTierStatusGroup = {
  event_id: string;
  edition_number: number;
  name: string;
  status: string;
  tiers: TierStatusRow[];
};

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const eventId = request.nextUrl.searchParams.get('eventId');
  const supabase = createAdminSupabaseClient();

  let tiersQuery = supabase
    .from('ticket_tiers')
    .select(
      `
      id,
      event_id,
      name,
      display_name,
      capacity,
      status,
      sort_order,
      events!ticket_tiers_event_id_fkey (
        id,
        edition_number,
        name,
        status
      )
    `,
    )
    .neq('status', 'hidden')
    .order('sort_order', { ascending: true });

  if (eventId) {
    tiersQuery = tiersQuery.eq('event_id', eventId);
  }

  const { data: tiers, error: tiersError } = await tiersQuery;

  if (tiersError) {
    return NextResponse.json({ error: tiersError.message }, { status: 500 });
  }

  const tierIds = (tiers ?? []).map((t) => t.id);
  if (tierIds.length === 0) {
    return NextResponse.json({ events: [] as EventTierStatusGroup[] });
  }

  let ticketsQuery = supabase
    .from('tickets')
    .select('tier_id')
    .in('tier_id', tierIds)
    .in('status', [...ACTIVE_TICKET]);

  if (eventId) {
    ticketsQuery = ticketsQuery.eq('event_id', eventId);
  }

  const { data: ticketRows, error: ticketsError } = await ticketsQuery;

  if (ticketsError) {
    return NextResponse.json({ error: ticketsError.message }, { status: 500 });
  }

  const soldByTier: Record<string, number> = {};
  for (const t of ticketRows ?? []) {
    soldByTier[t.tier_id] = (soldByTier[t.tier_id] ?? 0) + 1;
  }

  const groupMap = new Map<string, EventTierStatusGroup>();

  for (const tier of tiers ?? []) {
    const evRaw = tier.events as
      | { id: string; edition_number: number; name: string; status: string }
      | Array<{ id: string; edition_number: number; name: string; status: string }>
      | null;
    const ev = Array.isArray(evRaw) ? (evRaw[0] ?? null) : evRaw;
    if (!ev) continue;

    const sold = soldByTier[tier.id] ?? 0;
    const tierRow: TierStatusRow = {
      tier_id: tier.id,
      name: tier.name,
      display_name: tier.display_name,
      capacity: tier.capacity,
      sold,
      remaining: Math.max(0, tier.capacity - sold),
      tier_status: tier.status,
    };

    const existing = groupMap.get(ev.id);
    if (existing) {
      existing.tiers.push(tierRow);
    } else {
      groupMap.set(ev.id, {
        event_id: ev.id,
        edition_number: ev.edition_number,
        name: ev.name,
        status: ev.status,
        tiers: [tierRow],
      });
    }
  }

  const events = [...groupMap.values()].sort((a, b) => b.edition_number - a.edition_number);

  return NextResponse.json({ events });
}
