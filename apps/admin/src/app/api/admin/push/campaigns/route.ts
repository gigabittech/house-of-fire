import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isVapidConfigured, parsePushSegment, segmentRequiresEvent } from '@hof/push';
import {
  createPushCampaign,
  deliverPushCampaign,
} from '@/lib/pushCampaign.server';
import { normalizePagination, parsePagination } from '@/lib/pagination';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams);
  const offset = (page - 1) * pageSize;

  const supabase = createAdminSupabaseClient();
  const { data, error, count } = await supabase
    .from('push_campaigns')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    campaigns: data ?? [],
    pagination: normalizePagination(null, page, pageSize, count ?? 0),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  if (!isVapidConfigured()) {
    return NextResponse.json(
      { error: 'VAPID keys are not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.' },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    title?: string;
    body?: string;
    url?: string;
    segment?: string;
    eventId?: string;
    send?: boolean;
    meta?: Record<string, unknown>;
  };

  const title = body.title?.trim();
  const messageBody = body.body?.trim();
  const segment = parsePushSegment(body.segment);
  const eventId = body.eventId?.trim() || null;

  if (!title || !messageBody) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
  }

  if (!segment) {
    return NextResponse.json({ error: 'Invalid segment' }, { status: 400 });
  }

  if (segmentRequiresEvent(segment) && !eventId) {
    return NextResponse.json({ error: 'eventId is required for event attendees' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  try {
    const created = await createPushCampaign(supabase, {
      title,
      body: messageBody,
      url: body.url?.trim() || '/',
      segment,
      eventId,
      createdBy: auth.userId,
      meta: body.meta,
    });

    if (body.send === false) {
      return NextResponse.json({ campaignId: created.id, targetCount: created.targetCount }, { status: 201 });
    }

    const delivery = await deliverPushCampaign(supabase, created.id);

    const { data: campaign } = await supabase
      .from('push_campaigns')
      .select('*')
      .eq('id', created.id)
      .single();

    return NextResponse.json(
      {
        campaign,
        delivery,
        campaignId: created.id,
        targetCount: created.targetCount,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
