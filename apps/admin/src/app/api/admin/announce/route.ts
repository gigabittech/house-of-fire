import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isVapidConfigured } from '@hof/push';
import { createPushCampaign, deliverPushCampaign } from '@/lib/pushCampaign.server';
import { resend } from '@/lib/resend';
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
    mediaUrls?: string[];
    channels?: { feed?: boolean; email?: boolean; sms?: boolean };
  };

  const {
    title,
    body: postBody,
    channel = 'general',
    eventId,
    draft,
    channels,
    mediaUrls,
    pushSegment,
  } = body;

  if (channels?.sms) {
    return NextResponse.json(
      { error: 'SMS is not configured for this environment' },
      { status: 400 },
    );
  }

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

  const safeMedia =
    Array.isArray(mediaUrls) && mediaUrls.length > 0
      ? mediaUrls.filter((u) => typeof u === 'string' && u.startsWith('http')).slice(0, 5)
      : [];

  const { data: post, error } = await admin
    .from('posts')
    .insert({
      author_id: user.id,
      channel: draft ? 'crew' : safeChannel,
      title: title.trim(),
      body: postBody?.trim() ?? null,
      is_anonymous: false,
      event_id: eventId ?? null,
      media_urls: safeMedia,
      moderation_status: draft ? 'draft' : 'approved',
    })
    .select('id, title, channel, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (channels?.email && !draft) {
    const { data: subscribers } = await admin
      .from('newsletter_subscribers')
      .select('email')
      .limit(500);

    const emails = (subscribers ?? []).map((s) => s.email).filter(Boolean);
    if (emails.length > 0) {
      const imagesHtml =
        safeMedia.length > 0
          ? safeMedia
              .map((url) => `<p><img src="${url}" alt="" style="max-width:100%"/></p>`)
              .join('')
          : '';
      try {
        await resend.emails.send({
          to: emails,
          subject: title.trim(),
          html: `<p>${(postBody ?? '').replace(/\n/g, '<br/>')}</p>${imagesHtml}`,
          text: postBody ?? undefined,
          log: {
            kind: 'announce',
            projectId: eventId ?? undefined,
            meta: { postId: post.id, recipientCount: emails.length },
          },
        });
      } catch (e) {
        console.error('[announce] email send failed', e);
      }
    } else {
      console.warn('[announce] no newsletter subscribers to email');
    }
  }

  let pushCampaignId: string | null = null;
  if (channels?.push && !draft && isVapidConfigured()) {
    try {
      const segment = pushSegment ?? 'all_members';
      const created = await createPushCampaign(admin, {
        title: title.trim(),
        body: (postBody?.trim() || title.trim()).slice(0, 240),
        url: eventId ? `/event` : '/',
        segment,
        eventId: segment === 'all_members' ? null : (eventId ?? null),
        createdBy: user.id,
        meta: { postId: post.id, source: 'announce' },
      });
      await deliverPushCampaign(admin, created.id);
      pushCampaignId = created.id;
    } catch (e) {
      console.error('[announce] push send failed', e);
    }
  }

  console.log(`[announce] post=${post.id} channel=${safeChannel} by=${user.id}`);

  return NextResponse.json({ post, pushCampaignId }, { status: 201 });
}
