import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../../lib/supabase.server';

const VALID_REASONS = ['spam', 'harassment', 'inappropriate', 'off-topic', 'other'];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { reason?: string };
  const reason = body.reason?.trim() || 'other';

  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
  }

  const { data: post } = await supabase.from('posts').select('id').eq('id', id).single();
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const { data: existing } = await supabase
    .from('content_reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('post_id', id)
    .eq('status', 'open')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, alreadyReported: true });
  }

  const { error } = await supabase.from('content_reports').insert({
    reporter_id: user.id,
    post_id: id,
    reason,
    status: 'open',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
