import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { eventFormPayloadToInsert, parseEventPayload, type EventFormPayload } from '@/lib/eventPayload';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET(request: NextRequest) {
  const supabase = createAdminSupabaseClient();
  const includeStats = request.nextUrl.searchParams.get('includeStats') === '1';

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('edition_number', { ascending: false });

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  if (!includeStats) {
    return NextResponse.json({ events: events ?? [] });
  }

  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('event_id, amount_cents, status')
    .in('status', ['valid', 'used']);

  if (ticketsError) {
    return NextResponse.json({ error: ticketsError.message }, { status: 500 });
  }

  const statsByEvent: Record<string, { sold: number; gross_cents: number }> = {};
  for (const t of tickets ?? []) {
    const cur = statsByEvent[t.event_id] ?? { sold: 0, gross_cents: 0 };
    statsByEvent[t.event_id] = {
      sold: cur.sold + 1,
      gross_cents: cur.gross_cents + t.amount_cents,
    };
  }

  const withStats = (events ?? []).map((ev) => {
    const s = statsByEvent[ev.id] ?? { sold: 0, gross_cents: 0 };
    return {
      ...ev,
      sold: s.sold,
      gross_cents: s.gross_cents,
    };
  });

  return NextResponse.json({ events: withStats });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    name?: string;
    edition_number?: number;
    date?: string;
    venue_name?: string;
    venue_address?: string;
    capacity?: number;
    duplicateFromId?: string;
  };

  const supabase = createAdminSupabaseClient();

  if (body.duplicateFromId) {
    const { data: source, error: srcErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', body.duplicateFromId)
      .single();

    if (srcErr ?? !source) {
      return NextResponse.json({ error: 'Source event not found' }, { status: 404 });
    }

    const { data: maxEd } = await supabase
      .from('events')
      .select('edition_number')
      .order('edition_number', { ascending: false })
      .limit(1)
      .single();

    const nextEdition = (maxEd?.edition_number ?? source.edition_number) + 1;

    const { data: created, error: createErr } = await supabase
      .from('events')
      .insert({
        edition_number: nextEdition,
        name: body.name ?? `${source.name} (copy)`,
        tagline: source.tagline,
        date: body.date ?? source.date,
        doors_open: source.doors_open,
        doors_close: source.doors_close,
        venue_name: source.venue_name,
        venue_address: source.venue_address,
        venue_lat: source.venue_lat,
        venue_lng: source.venue_lng,
        capacity: body.capacity ?? source.capacity,
        status: 'upcoming',
        hero_image_url: source.hero_image_url,
        faqs: source.faqs ?? [],
      })
      .select()
      .single();

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 500 });
    }

    return NextResponse.json({ event: created });
  }

  const parsed = parseEventPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const full = parsed.data as EventFormPayload;

  const { data: created, error: createErr } = await supabase
    .from('events')
    .insert(eventFormPayloadToInsert(full))
    .select()
    .single();

  if (createErr) {
    return NextResponse.json({ error: createErr.message }, { status: 500 });
  }

  return NextResponse.json({ event: created }, { status: 201 });
}
