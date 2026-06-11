import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

type RouteContext = { params: Promise<{ id: string }> };

const CACHE_HEADER = 'private, max-age=5';

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { id: eventId } = await context.params;
  if (!eventId) {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc('event_inventory_snapshot', {
    p_event_id: eventId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': CACHE_HEADER,
    },
  });
}
