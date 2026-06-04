import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getActiveEvent, NO_EVENTS_MESSAGE } from '@/lib/liveEvent.server';
import { normalizeGuestTicket } from '@/lib/guestTicket';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

const GUEST_SELECT = `
  id,
  code,
  event_id,
  tier_id,
  order_id,
  amount_cents,
  fee_cents,
  status,
  purchased_at,
  used_at,
  checked_in_at,
  source,
  metadata,
  qr_data,
  stripe_charge_id,
  profiles!tickets_holder_id_fkey (
    id,
    display_name,
    handle,
    avatar_url
  ),
  ticket_tiers!tickets_tier_id_fkey (
    id,
    display_name,
    name
  ),
  events!tickets_event_id_fkey (
    id,
    edition_number,
    name,
    date,
    venue_name,
    status
  ),
  orders!tickets_order_id_fkey (
    id,
    subtotal_cents,
    discount_cents,
    fee_cents,
    total_cents,
    stripe_payment_intent_id,
    status,
    created_at
  )
`;

export async function GET(request: NextRequest) {
  const eventIdParam = request.nextUrl.searchParams.get('eventId');
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(5, parseInt(request.nextUrl.searchParams.get('pageSize') ?? '10', 10) || 10),
  );

  const supabase = createAdminSupabaseClient();

  let eventId = eventIdParam;
  if (!eventId) {
    const { data: active } = await getActiveEvent(supabase, 'id');
    if (!active) {
      return NextResponse.json({ error: NO_EVENTS_MESSAGE }, { status: 404 });
    }
    eventId = active.id;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: rows, error, count } = await supabase
    .from('tickets')
    .select(GUEST_SELECT, { count: 'exact' })
    .eq('event_id', eventId)
    .eq('status', 'used')
    .order('checked_in_at', { ascending: false, nullsFirst: false })
    .order('used_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const guests = (rows ?? []).map((row) =>
    normalizeGuestTicket(row as Record<string, unknown>),
  );

  return NextResponse.json({
    guests,
    total: count ?? 0,
    page,
    pageSize,
  });
}
