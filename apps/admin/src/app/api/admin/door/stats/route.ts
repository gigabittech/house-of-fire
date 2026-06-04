import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getActiveEvent, NO_EVENTS_MESSAGE } from '@/lib/liveEvent.server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

function isWalkup(t: { source?: string | null; stripe_charge_id?: string | null }): boolean {
  return t.source === 'door' || (t.stripe_charge_id ?? '').startsWith('door-');
}

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get('eventId');
  const supabase = createAdminSupabaseClient();

  let event: {
    id: string;
    edition_number: number;
    name: string;
    venue_name: string;
    doors_open: string;
    doors_close: string;
    date: string;
    capacity: number;
    status: string;
  } | null = null;

  if (eventId) {
    const { data, error: eventError } = await supabase
      .from('events')
      .select('id, edition_number, name, venue_name, doors_open, doors_close, date, capacity, status')
      .eq('id', eventId)
      .maybeSingle();
    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }
    event = data;
  } else {
    const { data, error: eventError } = await getActiveEvent(
      supabase,
      'id, edition_number, name, venue_name, doors_open, doors_close, date, capacity, status',
    );
    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }
    event = data;
  }

  if (!event) {
    return NextResponse.json({ error: NO_EVENTS_MESSAGE }, { status: 404 });
  }

  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, status, stripe_charge_id, amount_cents, source, tier_id')
    .eq('event_id', event.id)
    .in('status', ['valid', 'used']);

  if (ticketsError) {
    return NextResponse.json({ error: ticketsError.message }, { status: 500 });
  }

  const { data: tiers, error: tiersError } = await supabase
    .from('ticket_tiers')
    .select('id, name, display_name, description, price_cents, fee_cents, capacity, status, sort_order')
    .eq('event_id', event.id)
    .neq('status', 'hidden')
    .order('sort_order', { ascending: true });

  if (tiersError) {
    return NextResponse.json({ error: tiersError.message }, { status: 500 });
  }

  const list = tickets ?? [];
  const sold = list.length;
  const scanned = list.filter((t) => t.status === 'used').length;
  const walkups = list.filter(isWalkup);
  const walkupCents = walkups.reduce((s, t) => s + t.amount_cents, 0);
  const remaining = Math.max(0, event.capacity - sold);

  const soldByTier: Record<string, number> = {};
  for (const t of list) {
    soldByTier[t.tier_id] = (soldByTier[t.tier_id] ?? 0) + 1;
  }

  const tierOptions = (tiers ?? []).map((t) => {
    const tierSold = soldByTier[t.id] ?? 0;
    const tierRemaining = Math.max(0, t.capacity - tierSold);
    const purchasable =
      t.status === 'available' && tierRemaining > 0 && remaining > 0;
    return {
      id: t.id,
      name: t.name,
      display_name: t.display_name ?? t.name,
      description: t.description ?? null,
      price_cents: t.price_cents,
      fee_cents: t.fee_cents ?? 0,
      status: t.status,
      sold: tierSold,
      remaining: tierRemaining,
      purchasable,
    };
  });

  return NextResponse.json({
    event: {
      id: event.id,
      edition_number: event.edition_number,
      name: event.name,
      venue_name: event.venue_name,
      doors_open: event.doors_open,
      doors_close: event.doors_close,
      date: event.date,
      status: event.status,
    },
    stats: {
      sold,
      scanned,
      walkupCount: walkups.length,
      walkupGrossCents: walkupCents,
      remaining,
      capacity: event.capacity,
    },
    tiers: tierOptions,
  });
}
