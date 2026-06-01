import { NextResponse, type NextRequest } from 'next/server.js';
import { createServerSupabaseClient } from '../../../../lib/supabase.server.js';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    tier?: string; // 'ga' or 'vip'
    qty?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    pay_method?: string;
  };

  const { tier, qty = 1, first_name, last_name, email, pay_method, phone } = body;

  if (!tier || !first_name || !last_name || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const safeQty = Math.min(Math.max(1, Math.floor(qty)), 4);
  const supabase = await createServerSupabaseClient();

  // Get the upcoming event
  const { data: event } = await supabase
    .from('events')
    .select('id, edition_number')
    .eq('status', 'upcoming')
    .order('edition_number', { ascending: false })
    .limit(1)
    .single();

  if (!event) {
    return NextResponse.json({ error: 'No upcoming event' }, { status: 404 });
  }

  // Get the tier — match by name (case-insensitive)
  const { data: tierData } = await supabase
    .from('ticket_tiers')
    .select('id, price_cents, display_name, name')
    .eq('event_id', event.id)
    .ilike('name', tier)
    .single();

  if (!tierData) {
    return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const edStr = String(event.edition_number).padStart(2, '0');

  // Build ticket inserts — door sales have no holder_id (guest buyers)
  const tickets = Array.from({ length: safeQty }, () => {
    const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
    const code = `HOF-${edStr}-DOOR-${suffix}`;
    return {
      event_id: event.id,
      tier_id: tierData.id,
      holder_id: null as string | null,
      code,
      qr_data: code,
      amount_cents: tierData.price_cents,
      fee_cents: 0,
      status: 'used' as const,       // door sale = immediately consumed
      source: 'door',
      purchased_at: now,
      checked_in_at: now,            // door sale = immediate check-in
      used_at: now,
      metadata: {
        first_name,
        last_name,
        email,
        phone: phone ?? null,
        pay_method: pay_method ?? 'cash',
      },
    };
  });

  const { data: created, error: insertError } = await supabase
    .from('tickets')
    .insert(tickets)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    tickets: created,
    tier: { display_name: tierData.display_name, name: tierData.name },
    total_cents: tierData.price_cents * safeQty,
  });
}
