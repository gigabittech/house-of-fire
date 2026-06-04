import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../../lib/database.types';
import { validateCheckoutRequest } from '../../../../lib/checkoutValidation';
import { rateLimitCheck } from '../../../../lib/rateLimit';
import { getStripe } from '../../../../lib/stripe';
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from '../../../../lib/supabase.server';
import { computeCheckoutAmounts } from '../../../../lib/ticketPricing';
import { clampOrderQuantity } from '../../../../lib/ticketLimits';

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
  const { tierId, quantity: rawQuantity = 1, codeId, discountCents = 0 } = body;

  if (!tierId) {
    return NextResponse.json({ error: 'tierId required' }, { status: 400 });
  }

  const inventorySupabase = await createServiceRoleClient();
  const validation = await validateCheckoutRequest(inventorySupabase, {
    userId: user.id,
    tierId,
    quantity: rawQuantity,
  });

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const quantity = validation.quantity;

  const { data: tier } = await supabase.from('ticket_tiers').select('*').eq('id', tierId).single();

  if (!tier) {
    return NextResponse.json({ error: 'Tier not available' }, { status: 400 });
  }
  const tierRow = tier as TicketTierRow;

  const { data: eventData } = await supabase
    .from('events')
    .select('*')
    .eq('id', tierRow.event_id)
    .single();
  const ev = eventData as EventRow | null;

  if (!ev || (ev.status !== 'live' && ev.status !== 'upcoming')) {
    return NextResponse.json({ error: 'Tickets are not available for this event' }, { status: 400 });
  }

  const tierFeeCents = (tierRow as TicketTierRow & { fee_cents?: number }).fee_cents ?? 0;
  const amounts = computeCheckoutAmounts({
    priceCents: tierRow.price_cents,
    feeCents: tierFeeCents,
    quantity,
    discountCents: discountCents ?? 0,
  });
  const { subtotalCents: subtotal, discountCents: discountApplied, feeCents: fee, totalCents: total } =
    amounts;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const paymentIntent = await getStripe().paymentIntents.create({
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
    quantity: clampOrderQuantity(quantity),
  });
}
