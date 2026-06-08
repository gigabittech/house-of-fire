import { type NextRequest, NextResponse } from 'next/server';
import { fetchEventBySlug } from '../../../../../lib/resolveEventSlug';
import { createServerSupabaseClient } from '../../../../../lib/supabase.server';

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { eventId: slug } = await context.params;
  const supabase = await createServerSupabaseClient();

  const { data: event, error: eventError } = await fetchEventBySlug(supabase, slug);

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

  return NextResponse.json({ event, photos: photos ?? [] });
}
