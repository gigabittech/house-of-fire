import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      channel,
      title,
      body,
      created_at,
      profiles!posts_author_id_fkey (
        id,
        handle,
        display_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id param' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from('posts').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
