import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get('eventId');
  if (!eventId) {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.rpc('admin_dashboard_event_metrics', {
    p_event_id: eventId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload = data as {
    salesData?: number[];
    doorSalesByDay?: number[];
    salesByChannel?: { online: number; door: number };
    tierBars?: Array<{ label: string; sold: number; cap: number }>;
    openRequests?: number;
    eventStats?: { sold: number; scanned: number; gross_cents: number };
  } | null;

  const salesData = Array.isArray(payload?.salesData) ? payload.salesData : [0];
  const doorSalesByDay = Array.isArray(payload?.doorSalesByDay) ? payload.doorSalesByDay : [0];

  return NextResponse.json({
    salesData,
    doorSalesByDay,
    salesByChannel: payload?.salesByChannel ?? { online: 0, door: 0 },
    tierBars: payload?.tierBars ?? [],
    openRequests: payload?.openRequests ?? 0,
    eventStats: payload?.eventStats ?? { sold: 0, scanned: 0, gross_cents: 0 },
  });
}
