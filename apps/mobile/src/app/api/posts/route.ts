import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../lib/supabase.server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel');
  const eventId = searchParams.get('eventId');

  let query = supabase
    .from('posts')
    .select('*, profiles!author_id(handle, display_name, role, avatar_url)')
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  if (channel)
    query = query.eq('channel', channel as 'general' | 'lineup' | 'recap' | 'help' | 'crew');
  if (eventId) query = query.eq('event_id', eventId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as {
    channel: string;
    title: string;
    body?: string;
    isAnonymous?: boolean;
    eventId?: string;
    mediaUrls?: string[];
  };
  const { channel, title, body: postBody, isAnonymous = false, eventId, mediaUrls } = body;

  if (!channel || !title) {
    return NextResponse.json({ error: 'channel and title required' }, { status: 400 });
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
      body: postBody ?? null,
      is_anonymous: isAnonymous,
      event_id: eventId ?? null,
      media_urls: safeMedia,
      moderation_status: 'pending',
    })
    .select('*, profiles!author_id(handle, display_name, role, avatar_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ post }, { status: 201 });
}
