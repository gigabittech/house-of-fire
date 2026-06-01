import { NextResponse, type NextRequest } from 'next/server.js';
import { createServerSupabaseClient } from '../../../../lib/supabase.server.js';
import { stripe } from '../../../../lib/stripe.js';
import { rateLimitCheck } from '../../../../lib/rateLimit.js';
import type { Database } from '../../../../lib/database.types.js';

const HOF_FEE_RATE = 0.07; // 7% platform fee

type TicketTierRow = Database['public']['Tables']['ticket_tiers']['Row'];
type EventRow = Database['public']['Tables']['events']['Row'];

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const allowed = rateLimitCheck('checkout:' + ip, 10, 60_000); // 10 per minute
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    tierId: string;
    quantity: number;
    promoCode?: string;
    codeId?: string;
    discountCents?: number;
  };
  const { tierId, quantity = 1, codeId, discountCents = 0 } = body;

  if (!tierId) {
    return NextResponse.json({ error: 'tierId required' }, { status: 400 });
  }

  // Get tier
  const { data: tier } = await supabase.from('ticket_tiers').select('*').eq('id', tierId).single();

  if (!tier || (tier as TicketTierRow).status === 'sold_out') {
    return NextResponse.json({ error: 'Tier not available' }, { status: 400 });
  }
  const tierRow = tier as TicketTierRow;

  // Get event
  const { data: eventData } = await supabase
    .from('events')
    .select('*')
    .eq('id', tierRow.event_id)
    .single();
  const ev = eventData as EventRow | null;

  const subtotal = tierRow.price_cents * quantity;
  const discountApplied = Math.min(discountCents ?? 0, subtotal); // clamp — can't discount more than subtotal
  const discountedSubtotal = subtotal - discountApplied;
  const fee = Math.round(discountedSubtotal * HOF_FEE_RATE);
  const total = discountedSubtotal + fee;

  // Get profile for holder name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId: user.id,
      tierId,
      eventId: tierRow.event_id,
      quantity: String(quantity),
      subtotal: String(subtotal),
      discountCents: String(discountApplied),
      fee: String(fee),
      codeId: codeId ?? '',
      holderName: profile?.display_name ?? '',
      holderEmail: user.email ?? '',
    },
    description: `House of Fire — Ed ${ev?.edition_number ?? '?'} ${tierRow.display_name} × ${quantity}`,
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: total,
    subtotal,
    discountCents: discountApplied,
    fee,
  });
}
