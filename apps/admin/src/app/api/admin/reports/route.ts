import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    id: string;
    status: 'dismissed' | 'resolved';
    hidePost?: boolean;
  };

  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: report, error: reportError } = await supabase
    .from('content_reports')
    .update({ status: body.status })
    .eq('id', body.id)
    .select('post_id')
    .single();

  if (reportError) {
    return NextResponse.json({ error: reportError.message }, { status: 500 });
  }

  if (body.hidePost && report?.post_id) {
    await supabase.from('posts').update({ moderation_status: 'hidden' }).eq('id', report.post_id);
  }

  return NextResponse.json({ ok: true });
}
