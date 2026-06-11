import { NextResponse } from 'next/server';
import { eventPhotoGridUrl } from '@hof/media';
import { listEventPhotosRpc } from '../../../../lib/eventPhotosApi.server';
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

  try {
    const { photos } = await listEventPhotosRpc(supabase, event.id, null, STRIP_PHOTO_LIMIT);

    return NextResponse.json({
      event: {
        edition_number: event.edition_number,
        name: event.name,
        date: event.date,
      },
      photos: photos.map((photo) => ({
        id: photo.id,
        public_url: photo.public_url,
        storage_path: photo.storage_path,
        thumb_url: eventPhotoGridUrl(photo),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load photos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
