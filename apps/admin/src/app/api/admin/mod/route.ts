import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

const postSelect = `
  id,
  channel,
  title,
  body,
  is_pinned,
  moderation_status,
  created_at,
  profiles!posts_author_id_fkey (
    id,
    handle,
    display_name,
    avatar_url
  )
`;

export async function GET() {
  const supabase = createAdminSupabaseClient();

  const { data: queue, error: queueError } = await supabase
    .from('posts')
    .select(postSelect)
    .eq('moderation_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(30);

  if (queueError) {
    return NextResponse.json({ error: queueError.message }, { status: 500 });
  }

  const { data: pinned } = await supabase
    .from('posts')
    .select(postSelect)
    .eq('is_pinned', true)
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: reports, error: reportsError } = await supabase
    .from('content_reports')
    .select(`
      id,
      reason,
      status,
      created_at,
      reporter:profiles!content_reports_reporter_id_fkey ( handle, display_name ),
      post:posts ( id, title, body, profiles!posts_author_id_fkey ( handle, display_name ) )
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50);

  if (reportsError) {
    return NextResponse.json({
      posts: queue ?? [],
      pinned: pinned ?? [],
      reports: [],
      reportsError: reportsError.message,
    });
  }

  return NextResponse.json({
    posts: queue ?? [],
    pinned: pinned ?? [],
    reports: reports ?? [],
  });
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
