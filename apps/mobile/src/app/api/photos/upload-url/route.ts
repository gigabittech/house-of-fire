import { type NextRequest, NextResponse } from 'next/server';
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from '../../../../lib/supabase.server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId, fileName } = (await request.json()) as {
    eventId: string;
    fileName: string;
    contentType: string;
  };

  const ext = fileName.split('.').pop() ?? 'jpg';
  const storagePath = `events/${eventId}/${user.id}/${Date.now()}.${ext}`;

  const serviceClient = await createServiceRoleClient();
  const { data, error } = await serviceClient.storage
    .from('event-photos')
    .createSignedUploadUrl(storagePath);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pre-create the photo record
  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos/${storagePath}`;
  const { data: photo } = await serviceClient
    .from('event_photos')
    .insert({
      event_id: eventId,
      uploader_id: user.id,
      storage_path: storagePath,
      public_url: publicUrl,
    })
    .select()
    .single();

  return NextResponse.json({
    signedUrl: data.signedUrl,
    uploadUrl: data.signedUrl, // alias
    token: data.token,
    storagePath,
    photoId: photo?.id,
    publicUrl,
  });
}
