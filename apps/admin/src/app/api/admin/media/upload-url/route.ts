import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';
import { requireAdminRole } from '@/lib/requireAdminRole';

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { eventId, fileName, caption } = (await request.json()) as {
    eventId?: string;
    fileName?: string;
    caption?: string;
  };

  if (!eventId?.trim()) {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }
  if (!fileName?.trim()) {
    return NextResponse.json({ error: 'fileName required' }, { status: 400 });
  }

  const ext = (fileName.split('.').pop() ?? 'jpg').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const storagePath = `events/${eventId}/${auth.userId}/${Date.now()}.${ext}`;
  const { data, error } = await admin.storage
    .from('event-photos')
    .createSignedUploadUrl(storagePath);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos/${storagePath}`;
  const trimmedCaption = caption?.trim() || null;

  const { data: photo, error: insertError } = await admin
    .from('event_photos')
    .insert({
      event_id: eventId,
      uploader_id: auth.userId,
      storage_path: storagePath,
      public_url: publicUrl,
      status: 'approved',
      caption: trimmedCaption,
    })
    .select('id')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
    publicUrl,
    photoId: photo?.id,
  });
}
