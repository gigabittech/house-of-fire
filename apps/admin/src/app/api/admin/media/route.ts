import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin.js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status') ?? 'pending';
  const status = (['pending', 'approved', 'rejected'].includes(statusParam)
    ? statusParam
    : 'pending') as 'pending' | 'approved' | 'rejected';

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('event_photos')
    .select(`
      id,
      event_id,
      storage_path,
      public_url,
      status,
      created_at,
      profiles!event_photos_uploader_id_fkey (
        id,
        handle,
        display_name,
        avatar_url
      )
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ photos: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as { id: string; status: 'approved' | 'rejected' };
  const { id, status } = body;

  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from('event_photos')
    .update({ status })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
