import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase.server';

type RouteContext = { params: Promise<{ eventId: string }> };

const CACHE_HEADER = 'public, s-maxage=5, stale-while-revalidate=10';

export async function GET(_request: NextRequest, context: RouteContext) {
  const { eventId } = await context.params;
  if (!eventId) {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase.rpc('event_inventory_snapshot', {
    p_event_id: eventId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const payload = data as Record<string, unknown>;

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': CACHE_HEADER,
    },
  });
}
