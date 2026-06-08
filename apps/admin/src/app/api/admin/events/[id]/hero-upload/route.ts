import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { validateImageFile } from '@/lib/storageUpload';

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { id: eventId } = await context.params;
  const form = await request.formData();
  const file = form.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'file required' }, { status: 400 });
  }

  const sizeError = validateImageFile(file);
  if (sizeError) {
    return NextResponse.json({ error: sizeError }, { status: 400 });
  }

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 });
  }

  const storagePath = `events/${eventId}/hero.${ext}`;
  const admin = createAdminSupabaseClient();

  const { data: signed, error: signError } = await admin.storage
    .from('event-heroes')
    .createSignedUploadUrl(storagePath);

  if (signError) {
    return NextResponse.json({ error: signError.message }, { status: 500 });
  }

  const putRes = await fetch(signed.signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });

  if (!putRes.ok) {
    return NextResponse.json({ error: `Upload failed (${putRes.status})` }, { status: 500 });
  }

  const hero_image_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-heroes/${storagePath}`;

  const { error: updateError } = await admin
    .from('events')
    .update({ hero_image_url })
    .eq('id', eventId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ hero_image_url });
}
