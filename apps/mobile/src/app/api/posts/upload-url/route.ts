import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase.server';

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  const storagePath = `posts/${user.id}/${Date.now()}.${ext}`;
  const serviceClient = await createServiceRoleClient();
  const { data, error } = await serviceClient.storage
    .from('event-photos')
    .createSignedUploadUrl(storagePath);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicUrl = `${base}/storage/v1/object/public/event-photos/${storagePath}`;

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
    publicUrl,
    contentType: contentType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  });
}
