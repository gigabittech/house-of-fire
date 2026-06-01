import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin.js';

interface SellRequestBody {
  tier_id: string;
  first_name: string;
  last_name: string;
  email: string;
  qty: number;
  pay_method: 'cash' | 'card' | 'tap';
}

function isSellBody(v: unknown): v is SellRequestBody {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj['tier_id'] === 'string' &&
    typeof obj['first_name'] === 'string' &&
    typeof obj['last_name'] === 'string' &&
    typeof obj['email'] === 'string' &&
    typeof obj['qty'] === 'number' &&
    typeof obj['pay_method'] === 'string'
  );
}


export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json() as unknown;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isSellBody(body)) {
    return NextResponse.json(
      { error: 'Missing required fields: tier_id, first_name, last_name, email, qty, pay_method' },
      { status: 400 },
    );
  }

  const { tier_id, first_name, last_name, email, qty, pay_method } = body;

  if (qty < 1 || qty > 10) {
    return NextResponse.json({ error: 'qty must be between 1 and 10' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  // Look up the tier to get pricing and event_id
  const { data: tier, error: tierError } = await supabase
    .from('ticket_tiers')
    .select('id, event_id, price_cents, capacity, name')
    .eq('id', tier_id)
    .single();

  if (tierError ?? tier === null) {
    return NextResponse.json({ error: 'Ticket tier not found' }, { status: 404 });
  }

  // Find or create profile by email
  const handle = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ?? 'guest';
  const displayName = `${first_name} ${last_name}`.trim();

  // listUsers supports a search filter by email
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });

  // Suppress unused-var: listError is informational only; we fall through to create
  void listError;

  const existingUser = listData?.users.find((u) => u.email === email) ?? null;

  let holderId: string;

  if (existingUser === null) {
    // Create a new auth user (no password — magic link only for later)
    const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { first_name, last_name },
    });

    if (createError !== null || newAuthUser.user === null) {
      return NextResponse.json({ error: createError?.message ?? 'Failed to create user' }, { status: 500 });
    }

    holderId = newAuthUser.user.id;

    // Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: holderId,
        handle,
        display_name: displayName,
        role: 'member',
      });

    if (profileError !== null) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  } else {
    holderId = existingUser.id;
  }

  // Get event edition number for proper ticket codes
  const { data: event } = await supabase
    .from('events')
    .select('edition_number')
    .eq('id', tier.event_id)
    .single();

  const edition = event?.edition_number ?? 0;

  // Count existing tickets to generate sequential codes
  const { count: existingCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', tier.event_id);

  const startN = (existingCount ?? 0) + 1;
  const edPad = String(edition).padStart(2, '0');

  // Insert tickets
  const now = new Date().toISOString();
  const tickets = Array.from({ length: qty }, (_, i) => {
    const n = startN + i;
    const code = `HOF-${edPad}-${String(n).padStart(4, '0')}`;
    const qr_data = JSON.stringify({ code, event: tier.event_id, v: 1 });
    return {
      code,
      event_id: tier.event_id,
      tier_id: tier.id,
      holder_id: holderId,
      amount_cents: tier.price_cents,
      fee_cents: 0,
      status: 'valid' as const,
      purchased_at: now,
      qr_data,
      stripe_payment_intent_id: null,
      stripe_charge_id: `door-${pay_method}-${Date.now()}`,
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from('tickets')
    .insert(tickets)
    .select('id, code');

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    outcome: 'sold',
    qty,
    pay_method,
    holder_id: holderId,
    tickets: inserted ?? [],
  });
}
