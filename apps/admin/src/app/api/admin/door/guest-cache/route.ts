import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Json } from '@/lib/database.types';
import { getActiveEvent, NO_EVENTS_MESSAGE } from '@/lib/liveEvent.server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

const CACHE_LIMIT = 5000;

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const eventIdParam = request.nextUrl.searchParams.get('eventId');
  const supabase = createAdminSupabaseClient();

  let eventId = eventIdParam;
  if (!eventId) {
    const { data: event } = await getActiveEvent(supabase, 'id');
    if (!event) {
      return NextResponse.json({ error: NO_EVENTS_MESSAGE }, { status: 404 });
    }
    eventId = event.id;
  }

  const [{ count: totalCount }, { data: tickets, error }] = await Promise.all([
    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('status', ['valid', 'used']),
    supabase
      .from('tickets')
      .select(
        'code, status, checked_in_at, used_at, holder_id, metadata, ticket_tiers!tickets_tier_id_fkey(display_name, name), profiles!tickets_holder_id_fkey(display_name, handle)',
      )
      .eq('event_id', eventId)
      .in('status', ['valid', 'used'])
      .limit(CACHE_LIMIT),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = totalCount ?? 0;
  const truncated = total > CACHE_LIMIT;

  const rows = (tickets ?? []).map((t) => {
    const profile = t.profiles as { display_name?: string; handle?: string } | null;
    const tier = t.ticket_tiers as { display_name?: string; name?: string } | null;
    const meta = t.metadata as Record<string, Json> | null;
    const metaName = meta
      ? `${String(meta['first_name'] ?? '')} ${String(meta['last_name'] ?? '')}`.trim()
      : '';
    const holderName = profile?.display_name ?? profile?.handle ?? (metaName || 'Guest');
    const tierName = tier?.display_name ?? tier?.name ?? 'GA';

    return {
      code: t.code,
      status: t.status,
      checked_in_at: t.checked_in_at ?? t.used_at,
      holder_name: holderName,
      tier_name: tierName,
    };
  });

  return NextResponse.json({
    eventId,
    fetchedAt: new Date().toISOString(),
    tickets: rows,
    totalCount: total,
    truncated,
    cacheLimit: CACHE_LIMIT,
  });
}
