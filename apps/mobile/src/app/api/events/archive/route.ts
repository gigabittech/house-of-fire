import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase.server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supabase = await createServerSupabaseClient();

  if (searchParams.get('yearsOnly') === '1') {
    const { data, error } = await supabase
      .from('events')
      .select('date')
      .eq('status', 'past')
      .order('date', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const years = [
      ...new Set((data ?? []).map((e) => e.date.slice(0, 4))),
    ].sort((a, b) => b.localeCompare(a));

    return NextResponse.json({ years });
  }

  const year = searchParams.get('year') ?? String(new Date().getFullYear());

  const startOfYear = `${year}-01-01T00:00:00Z`;
  const endOfYear = `${year}-12-31T23:59:59Z`;

  const { data, error } = await supabase
    .from('events')
    .select('*, event_photos(count)')
    .eq('status', 'past')
    .gte('date', startOfYear)
    .lte('date', endOfYear)
    .order('date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get ticket counts for each event
  const eventIds = (data ?? []).map((e: { id: string }) => e.id);
  const { data: ticketCounts } =
    eventIds.length > 0
      ? await supabase
          .from('tickets')
          .select('event_id')
          .in('event_id', eventIds)
          .in('status', ['valid', 'used'])
      : { data: [] };

  const countMap = (ticketCounts ?? []).reduce(
    (acc: Record<string, number>, t: { event_id: string }) => {
      acc[t.event_id] = (acc[t.event_id] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const events = (data ?? []).map((e: { id: string }) => ({
    ...e,
    attendee_count: countMap[e.id] ?? 0,
  }));

  return NextResponse.json({ events });
}
