import { type NextRequest, NextResponse } from 'next/server';
import { getActiveEvent } from '../../../lib/liveEvent.server';
import { createServerSupabaseClient } from '../../../lib/supabase.server';

function deriveTitle(title: string | undefined, body: string | undefined, channel: string): string {
  const trimmed = title?.trim();
  if (trimmed) return trimmed.slice(0, 200);
  const firstLine = body?.trim().split('\n')[0]?.trim();
  if (firstLine) return firstLine.slice(0, 80);
  return `Post in #${channel}`;
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel');
  const eventId = searchParams.get('eventId');
  const limitParam = searchParams.get('limit');
  const includeMyReactions = searchParams.get('includeMyReactions') === '1';
  const limit = limitParam ? Math.min(Math.max(Number.parseInt(limitParam, 10) || 50, 1), 50) : 50;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from('posts')
    .select('*, profiles!author_id(handle, display_name, role, avatar_url)')
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (channel)
    query = query.eq('channel', channel as 'general' | 'lineup' | 'recap' | 'help' | 'crew');

  if (eventId) {
    query = query.eq('event_id', eventId);
  } else {
    const { data: activeEvent } = await getActiveEvent(supabase, 'id');
    if (activeEvent) {
      query = query.or(`event_id.is.null,event_id.eq.${activeEvent.id}`);
    } else {
      query = query.is('event_id', null);
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const posts = data ?? [];
  let myReactionsByPost: Record<string, string[]> = {};

  if (includeMyReactions && user && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const { data: reactions } = await supabase
      .from('post_reactions')
      .select('post_id, emoji')
      .eq('user_id', user.id)
      .in('post_id', postIds);

    myReactionsByPost = (reactions ?? []).reduce<Record<string, string[]>>((acc, r) => {
      acc[r.post_id] = [r.emoji];
      return acc;
    }, {});
  }

  return NextResponse.json({
    posts,
    myReactionsByPost: includeMyReactions ? myReactionsByPost : undefined,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as {
    channel: string;
    title?: string;
    body?: string;
    isAnonymous?: boolean;
    eventId?: string;
    mediaUrls?: string[];
  };
  const {
    channel,
    title: rawTitle,
    body: postBody,
    isAnonymous = false,
    eventId: rawEventId,
    mediaUrls,
  } = body;

  if (!channel) {
    return NextResponse.json({ error: 'channel required' }, { status: 400 });
  }

  if (!postBody?.trim() && (!mediaUrls || mediaUrls.length === 0)) {
    return NextResponse.json({ error: 'body or media required' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (channel === 'crew' && profile?.role !== 'crew' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Crew channel is restricted' }, { status: 403 });
  }

  const title = deriveTitle(rawTitle, postBody, channel);

  let eventId = rawEventId ?? null;
  if (!eventId) {
    const { data: activeEvent } = await getActiveEvent(supabase, 'id');
    eventId = activeEvent?.id ?? null;
  }

  const safeMedia =
    Array.isArray(mediaUrls) && mediaUrls.length > 0
      ? mediaUrls.filter((u) => typeof u === 'string' && u.startsWith('http')).slice(0, 5)
      : [];

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      channel: channel as 'general' | 'lineup' | 'recap' | 'help' | 'crew',
      title,
      body: postBody?.trim() ?? null,
      is_anonymous: isAnonymous,
      event_id: eventId,
      media_urls: safeMedia,
      moderation_status: 'pending',
    })
    .select('*, profiles!author_id(handle, display_name, role, avatar_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ post }, { status: 201 });
}
