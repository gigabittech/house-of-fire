import { type NextRequest, NextResponse } from 'next/server';
import { validateImageFile } from '../../../../lib/storageUpload';
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from '../../../../lib/supabase.server';

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);
const AVATAR_BUCKET = 'event-photos';

function extFromFile(file: File): string {
  const fromName = (file.name.split('.').pop() ?? '').toLowerCase();
  if (ALLOWED_EXT.has(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName;
  const mime = file.type.toLowerCase();
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/heic') return 'heic';
  if (mime === 'image/heif') return 'heif';
  return 'jpg';
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Image file required' }, { status: 400 });
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const ext = extFromFile(file);
  const storagePath = `profiles/${user.id}/avatar.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const serviceClient = await createServiceRoleClient();

  const { error: uploadError } = await serviceClient.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicUrl = `${base}/storage/v1/object/public/${AVATAR_BUCKET}/${storagePath}?v=${Date.now()}`;

  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)
    .select('avatar_url')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ publicUrl: profile?.avatar_url ?? publicUrl });
}
