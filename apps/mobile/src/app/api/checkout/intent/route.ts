import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../../lib/database.types';
import { validateCheckoutRequest } from '../../../../lib/checkoutValidation';
import { rateLimitCheck } from '../../../../lib/rateLimit';
import { getStripe } from '../../../../lib/stripe';
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from '../../../../lib/supabase.server';
import { validateDiscountCodeForCheckout } from '../../../../lib/promoCodes';
import { computeCheckoutAmounts } from '../../../../lib/ticketPricing';
import { clampOrderQuantity } from '../../../../lib/ticketLimits';
import { isValidZipCode, normalizeZipCode } from '../../../../lib/zipCode';

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
    paymentIntentId?: string;
    buyerEmail?: string;
    buyerFirstName?: string;
    buyerLastName?: string;
    buyerPhone?: string;
    buyerZipCode?: string;
  };
  const {
    tierId,
    quantity: rawQuantity = 1,
    codeId,
    promoCode,
    discountCents = 0,
    paymentIntentId: existingPaymentIntentId,
    buyerEmail,
    buyerFirstName,
    buyerLastName,
    buyerPhone,
    buyerZipCode,
  } = body;

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
    return NextResponse.json(
      { error: 'Tickets are not available for this event' },
      { status: 400 },
    );
  }

  const tierFeeCents = (tierRow as TicketTierRow & { fee_cents?: number }).fee_cents ?? 0;
  const subtotalBeforeDiscount = tierRow.price_cents * quantity;

  let resolvedCodeId = '';
  let discountApplied = 0;

  if (codeId || promoCode?.trim()) {
    const promo = await validateDiscountCodeForCheckout(inventorySupabase, {
      tierId,
      subtotalCents: subtotalBeforeDiscount,
      codeId: codeId ?? null,
      rawCode: promoCode ?? null,
    });
    if (!promo.ok) {
      return NextResponse.json({ error: promo.error }, { status: 400 });
    }
    resolvedCodeId = promo.code.id;
    discountApplied = promo.discountCents;
  } else if (discountCents > 0) {
    return NextResponse.json({ error: 'Promo code required for discount' }, { status: 400 });
  }

  const amounts = computeCheckoutAmounts({
    priceCents: tierRow.price_cents,
    feeCents: tierFeeCents,
    quantity,
    discountCents: discountApplied,
  });
  const { subtotalCents: subtotal, feeCents: fee, totalCents: total } = amounts;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const trimmedBuyerEmail = buyerEmail?.trim() ?? '';
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (trimmedBuyerEmail && !emailRe.test(trimmedBuyerEmail)) {
    return NextResponse.json({ error: 'Invalid buyer email' }, { status: 400 });
  }

  const buyerFullName = [buyerFirstName?.trim(), buyerLastName?.trim()].filter(Boolean).join(' ');
  const holderName = buyerFullName || profile?.display_name?.trim() || '';
  const holderEmail = trimmedBuyerEmail || user.email || '';
  const holderPhone = buyerPhone?.trim() ?? '';
  const trimmedBuyerZip = buyerZipCode?.trim() ?? '';
  const submittingBuyerDetails = Boolean(
    buyerFirstName?.trim() || buyerLastName?.trim() || buyerPhone?.trim() || trimmedBuyerEmail,
  );

  if (submittingBuyerDetails) {
    if (!trimmedBuyerZip) {
      return NextResponse.json({ error: 'ZIP code required' }, { status: 400 });
    }
    if (!isValidZipCode(trimmedBuyerZip)) {
      return NextResponse.json({ error: 'Invalid ZIP code' }, { status: 400 });
    }
  } else if (trimmedBuyerZip && !isValidZipCode(trimmedBuyerZip)) {
    return NextResponse.json({ error: 'Invalid ZIP code' }, { status: 400 });
  }

  const holderZip = trimmedBuyerZip ? normalizeZipCode(trimmedBuyerZip) : '';

  const metadata = {
    userId: user.id,
    tierId,
    eventId: tierRow.event_id,
    quantity: String(quantity),
    subtotal: String(subtotal),
    discountCents: String(discountApplied),
    fee: String(fee),
    codeId: resolvedCodeId,
    holderName,
    holderEmail,
    holderPhone,
    holderZip,
  };

  const description = `House of Fire — Ed ${ev?.edition_number ?? '?'} ${tierRow.display_name} × ${quantity}`;

  let paymentIntent;
  if (existingPaymentIntentId?.trim()) {
    const existing = await getStripe().paymentIntents.retrieve(existingPaymentIntentId.trim());
    if (existing.metadata.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (
      existing.status !== 'requires_payment_method' &&
      existing.status !== 'requires_confirmation' &&
      existing.status !== 'requires_action'
    ) {
      return NextResponse.json(
        { error: 'Payment session can no longer be updated. Go back and try again.' },
        { status: 409 },
      );
    }
    paymentIntent = await getStripe().paymentIntents.update(existingPaymentIntentId.trim(), {
      amount: total,
      metadata,
      description,
    });
  } else {
    paymentIntent = await getStripe().paymentIntents.create({
      amount: total,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata,
      description,
    });
  }

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
