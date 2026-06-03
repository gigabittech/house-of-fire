import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';
import { createServerSupabaseClient } from '@/lib/supabase.server';

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
  };

  const { title, body: postBody, channel = 'general', eventId } = body;

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
      channel: safeChannel,
      title: title.trim(),
      body: postBody?.trim() ?? null,
      is_anonymous: false,
      event_id: eventId ?? null,
    })
    .select('id, title, channel, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[announce] post=${post.id} channel=${safeChannel} by=${user.id}`);

  return NextResponse.json({ post }, { status: 201 });
}
