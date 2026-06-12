import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getActiveEvent, NO_EVENTS_MESSAGE } from '@/lib/liveEvent.server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

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
      .select(
        'id, edition_number, name, venue_name, doors_open, doors_close, date, capacity, status',
      )
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

  const { data: statsPayload, error: statsError } = await supabase.rpc('admin_event_ticket_stats', {
    p_event_id: event.id,
  });

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  const payload = statsPayload as {
    stats?: {
      sold: number;
      scanned: number;
      walkupCount: number;
      walkupGrossCents: number;
      remaining: number;
      capacity: number;
    };
    tiers?: Array<{
      id: string;
      name: string;
      display_name: string;
      description: string | null;
      price_cents: number;
      fee_cents: number;
      status: string;
      sold: number;
      remaining: number;
      purchasable: boolean;
    }>;
  } | null;

  const stats = payload?.stats ?? {
    sold: 0,
    scanned: 0,
    walkupCount: 0,
    walkupGrossCents: 0,
    remaining: event.capacity,
    capacity: event.capacity,
  };

  const tierOptions = (payload?.tiers ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    display_name: t.display_name ?? t.name,
    description: t.description ?? null,
    price_cents: t.price_cents,
    fee_cents: t.fee_cents ?? 0,
    status: t.status,
    sold: t.sold,
    remaining: t.remaining,
    purchasable: t.purchasable,
  }));

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
      sold: stats.sold,
      scanned: stats.scanned,
      walkupCount: stats.walkupCount,
      walkupGrossCents: stats.walkupGrossCents,
      remaining: stats.remaining,
      capacity: stats.capacity,
    },
    tiers: tierOptions,
  });
}
