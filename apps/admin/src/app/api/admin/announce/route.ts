import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';
import { createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('posts')
    .select(`
      id,
      channel,
      title,
      body,
      created_at,
      reply_count,
      profiles!posts_author_id_fkey ( display_name, handle )
    `)
    .in('channel', ['general', 'lineup', 'recap', 'help', 'crew'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ history: data ?? [] });
}

export async function POST(request: NextRequest) {
  // Verify caller is admin or crew
  const serverClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await serverClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'crew')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as {
    title?: string;
    body?: string;
    channel?: string;
    eventId?: string;
    draft?: boolean;
    channels?: { feed?: boolean; email?: boolean; sms?: boolean };
  };

  const { title, body: postBody, channel = 'general', eventId, draft, channels } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  // Use service-role client to insert as the admin user's profile
  const admin = createAdminSupabaseClient();

  const validChannels = ['general', 'lineup', 'recap', 'help', 'crew'] as const;
  type Channel = (typeof validChannels)[number];
  const safeChannel: Channel = (validChannels as readonly string[]).includes(channel)
    ? (channel as Channel)
    : 'general';

  const { data: post, error } = await admin
    .from('posts')
    .insert({
      author_id: user.id,
      channel: draft ? 'crew' : safeChannel,
      title: title.trim(),
      body: postBody?.trim() ?? null,
      is_anonymous: false,
      event_id: eventId ?? null,
      moderation_status: draft ? 'draft' : 'approved',
    })
    .select('id, title, channel, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (channels?.email) {
    console.log(`[announce] email queued for post=${post.id}`);
  }
  if (channels?.sms) {
    console.log(`[announce] sms stub post=${post.id}`);
  }
  console.log(`[announce] post=${post.id} channel=${safeChannel} by=${user.id}`);

  return NextResponse.json({ post }, { status: 201 });
}
