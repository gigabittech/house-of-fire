import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../../lib/supabase.server';

interface RouteContext {
  params: Promise<{ edition: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { edition: editionRaw } = await context.params;
  const edition = Number(editionRaw);

  if (!Number.isInteger(edition) || edition < 1) {
    return NextResponse.json({ error: 'Invalid edition' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, edition_number, name, date, venue_name, status')
    .eq('edition_number', edition)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const { data: photos, error: photosError } = await supabase
    .from('event_photos')
    .select('id, public_url, storage_path, created_at')
    .eq('event_id', event.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  return NextResponse.json({
    event: {
      edition_number: event.edition_number,
      name: event.name,
      date: event.date,
      venue_name: event.venue_name,
      status: event.status,
    },
    photos: photos ?? [],
  });
}
