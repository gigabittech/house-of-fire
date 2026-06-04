import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getActiveEvent, NO_EVENTS_MESSAGE } from '@/lib/liveEvent.server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get('eventId');
  const supabase = createAdminSupabaseClient();

  let event: {
    id: string;
    edition_number: number;
    name: string;
    venue_name: string;
    doors_open: string;
    capacity: number;
    status: string;
  } | null = null;

  if (eventId) {
    const { data, error: eventError } = await supabase
      .from('events')
      .select('id, edition_number, name, venue_name, doors_open, capacity, status')
      .eq('id', eventId)
      .maybeSingle();
    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }
    event = data;
  } else {
    const { data, error: eventError } = await getActiveEvent(
      supabase,
      'id, edition_number, name, venue_name, doors_open, capacity, status',
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
    .select('id, status, stripe_charge_id, amount_cents')
    .eq('event_id', event.id)
    .in('status', ['valid', 'used']);

  if (ticketsError) {
    return NextResponse.json({ error: ticketsError.message }, { status: 500 });
  }

  const { data: tiers, error: tiersError } = await supabase
    .from('ticket_tiers')
    .select('id, name, display_name, price_cents, capacity, status')
    .eq('event_id', event.id)
    .neq('status', 'hidden')
    .order('sort_order', { ascending: true });

  if (tiersError) {
    return NextResponse.json({ error: tiersError.message }, { status: 500 });
  }

  const list = tickets ?? [];
  const sold = list.length;
  const scanned = list.filter((t) => t.status === 'used').length;
  const walkups = list.filter((t) => (t.stripe_charge_id ?? '').startsWith('door-'));
  const walkupCents = walkups.reduce((s, t) => s + t.amount_cents, 0);
  const remaining = Math.max(0, event.capacity - sold);

  const tierOptions = (tiers ?? []).map((t) => ({
    id: t.id,
    name: t.display_name ?? t.name,
    price_cents: t.price_cents,
    key: /vip/i.test(t.name) ? ('vip' as const) : ('ga' as const),
  }));

  return NextResponse.json({
    event: {
      id: event.id,
      edition_number: event.edition_number,
      name: event.name,
      venue_name: event.venue_name,
      doors_open: event.doors_open,
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
