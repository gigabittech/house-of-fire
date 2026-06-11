import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { applyModerationAction, enforcePinLimit } from '@/lib/moderatePost';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as {
    is_pinned?: boolean;
    moderation_status?: 'pending' | 'approved' | 'hidden' | 'draft' | 'rejected';
    moderation_note?: string;
    action?: 'approved' | 'rejected' | 'hidden' | 'deleted';
    reason?: string;
  };

  const supabase = createAdminSupabaseClient();

  if (body.action === 'deleted') {
    const result = await applyModerationAction({
      supabase,
      postId: id,
      moderatorId: auth.userId,
      action: 'deleted',
      reason: body.reason ?? body.moderation_note,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'approved' || body.action === 'rejected' || body.action === 'hidden') {
    const result = await applyModerationAction({
      supabase,
      postId: id,
      moderatorId: auth.userId,
      action: body.action,
      reason: body.reason ?? body.moderation_note,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    const { data } = await supabase
      .from('posts')
      .select('id, is_pinned, moderation_status, moderation_note')
      .eq('id', id)
      .single();
    return NextResponse.json({ post: data });
  }

  if (
    body.moderation_status === 'approved' ||
    body.moderation_status === 'rejected' ||
    body.moderation_status === 'hidden'
  ) {
    const modAction = body.moderation_status;
    const result = await applyModerationAction({
      supabase,
      postId: id,
      moderatorId: auth.userId,
      action: modAction,
      reason: body.moderation_note,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    const { data } = await supabase
      .from('posts')
      .select('id, is_pinned, moderation_status, moderation_note')
      .eq('id', id)
      .single();
    return NextResponse.json({ post: data });
  }

  if (body.is_pinned === true) {
    const { data: post } = await supabase.from('posts').select('channel').eq('id', id).single();
    if (post?.channel) {
      const pinCheck = await enforcePinLimit(supabase, id, post.channel);
      if (!pinCheck.ok) return NextResponse.json({ error: pinCheck.error }, { status: 400 });
    }
    await applyModerationAction({
      supabase,
      postId: id,
      moderatorId: auth.userId,
      action: 'pinned',
    });
    await supabase.from('posts').update({ is_pinned: true }).eq('id', id);
  } else if (body.is_pinned === false) {
    await applyModerationAction({
      supabase,
      postId: id,
      moderatorId: auth.userId,
      action: 'unpinned',
    });
    await supabase.from('posts').update({ is_pinned: false }).eq('id', id);
  }

  const { data, error } = await supabase
    .from('posts')
    .select('id, is_pinned, moderation_status, moderation_note')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}
