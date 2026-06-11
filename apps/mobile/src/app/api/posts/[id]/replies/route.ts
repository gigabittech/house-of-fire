import { type NextRequest, NextResponse } from 'next/server';
import { buildRepliesResponse, listPostRepliesRpc } from '../../../../../lib/communityApi.server';
import { parseFeedCursor, parsePageSize } from '../../../../../lib/cursorPagination';
import { notifyPostAuthor } from '../../../../../lib/postNotifications.server';
import { createServerSupabaseClient } from '../../../../../lib/supabase.server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const replyId = searchParams.get('replyId');

  if (replyId) {
    const { data, error } = await supabase
      .from('replies')
      .select('*, profiles!author_id(handle, display_name, role, avatar_url)')
      .eq('post_id', id)
      .eq('id', replyId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    return NextResponse.json({ reply: data });
  }

  const cursor = parseFeedCursor(searchParams);
  const pageSize = parsePageSize(searchParams, 30, 100);

  try {
    const { replies, hasMore } = await listPostRepliesRpc(supabase, id, cursor, pageSize);
    return NextResponse.json(buildRepliesResponse(replies, hasMore));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load replies';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { body: string; isAnonymous?: boolean };

  if (!body.body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 });

  const { data: reply, error } = await supabase
    .from('replies')
    .insert({
      post_id: id,
      author_id: user.id,
      body: body.body,
      is_anonymous: body.isAnonymous ?? false,
    })
    .select('*, profiles!author_id(handle, display_name, role, avatar_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: post } = await supabase
    .from('posts')
    .select('author_id, title, body')
    .eq('id', id)
    .single();

  if (post && post.author_id !== user.id) {
    const { data: replier } = await supabase
      .from('profiles')
      .select('display_name, handle')
      .eq('id', user.id)
      .single();

    const replierName = replier?.display_name ?? replier?.handle ?? 'Someone';
    const preview = (post.body ?? post.title ?? 'your post').slice(0, 80);

    await notifyPostAuthor({
      authorId: post.author_id,
      actorId: user.id,
      postId: id,
      type: 'reply',
      title: replierName,
      body: preview,
    });
  }

  return NextResponse.json({ reply }, { status: 201 });
}
