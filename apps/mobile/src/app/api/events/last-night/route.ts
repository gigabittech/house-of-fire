import { NextResponse } from 'next/server';
import { CUSTOMER_VISIBLE_PHOTO_STATUS } from '../../../../lib/eventPhotos.server';
import { createServerSupabaseClient } from '../../../../lib/supabase.server';

const STRIP_PHOTO_LIMIT = 8;

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, edition_number, name, date')
    .eq('status', 'past')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ event: null, photos: [] });
  }

  const { data: photos, error: photosError } = await supabase
    .from('event_photos')
    .select('id, public_url')
    .eq('event_id', event.id)
    .eq('status', CUSTOMER_VISIBLE_PHOTO_STATUS)
    .order('created_at', { ascending: false })
    .limit(STRIP_PHOTO_LIMIT);

  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  return NextResponse.json({
    event: {
      edition_number: event.edition_number,
      name: event.name,
      date: event.date,
    },
    photos: photos ?? [],
  });
}
