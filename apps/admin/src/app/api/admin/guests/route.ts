import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  normalizeGuestTicket,
  ticketMatchesEmail,
  type AdminGuestTicket,
} from '@/lib/guestTicket';
import { requireAdminRole } from '@/lib/requireAdminRole';
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
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const tierId = searchParams.get('tierId');
  const email = searchParams.get('email')?.trim() ?? '';
  const code = searchParams.get('code')?.trim() ?? '';

  const supabase = createAdminSupabaseClient();

  let query = supabase.from('tickets').select(GUEST_SELECT).order('purchased_at', { ascending: false });

  if (eventId) {
    query = query.eq('event_id', eventId);
  }
  if (tierId) {
    query = query.eq('tier_id', tierId);
  }
  if (code) {
    query = query.ilike('code', `%${code}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let tickets: AdminGuestTicket[] = (data ?? []).map((row) =>
    normalizeGuestTicket(row as Record<string, unknown>),
  );

  if (email) {
    tickets = tickets.filter((t) => ticketMatchesEmail(t, email));
  }

  return NextResponse.json({ guests: tickets });
}
