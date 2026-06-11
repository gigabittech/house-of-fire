import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';
import { requireAdminRole } from '@/lib/requireAdminRole';

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { fileName, contentType } = (await request.json()) as {
    fileName: string;
    contentType?: string;
  };

  if (!fileName?.trim()) {
    return NextResponse.json({ error: 'fileName required' }, { status: 400 });
  }

  const ext = (fileName.split('.').pop() ?? 'jpg').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 });
  }

  const storagePath = `announce/${auth.userId}/${Date.now()}.${ext}`;
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage
    .from('event-photos')
    .createSignedUploadUrl(storagePath);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos/${storagePath}`;

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
    publicUrl,
    contentType: contentType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  });
}
