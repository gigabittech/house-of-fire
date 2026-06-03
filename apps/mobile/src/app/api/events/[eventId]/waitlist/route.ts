import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../../lib/supabase.server';

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { eventId } = await context.params;

  const body = (await request.json()) as { email?: string; name?: string };
  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim() ?? '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Verify the event exists
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .single();

  if (eventError ?? !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Count existing entries to determine position
  const { count, error: countError } = await supabase
    .from('waitlist')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const position = (count ?? 0) + 1;

  const { error: insertError } = await supabase
    .from('waitlist')
    .insert({ event_id: eventId, email, name, position });

  if (insertError) {
    // 23505 = unique_violation (already on the waitlist)
    if (insertError.code === '23505') {
      return NextResponse.json({ ok: true, alreadyJoined: true });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, position });
}
