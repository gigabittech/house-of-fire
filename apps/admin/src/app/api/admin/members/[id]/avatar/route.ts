import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';
import { validateImageFile } from '@/lib/storageUpload';

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { id: memberId } = await params;
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Image file required' }, { status: 400 });
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', memberId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const ext = extFromFile(file);
  const storagePath = `profiles/${memberId}/avatar.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
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

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', memberId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ publicUrl });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { id: memberId } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .eq('id', memberId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', memberId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
