import { type NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { fulfillPaymentIntent } from '../../../../lib/fulfillPayment';
import { getStripe } from '../../../../lib/stripe';
import { createServerSupabaseClient } from '../../../../lib/supabase.server';

/**
 * Fulfill tickets after client-side payment confirmation.
 * Local dev does not require `stripe listen`; production webhooks remain a backup.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { paymentIntentId?: string };
  const { paymentIntentId } = body;

  if (!paymentIntentId) {
    return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 });
  }

  let pi: Stripe.PaymentIntent;
  try {
    pi = await getStripe().paymentIntents.retrieve(paymentIntentId);
  } catch {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  if (pi.metadata.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await fulfillPaymentIntent(pi);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  let ticketsQuery = supabase
    .from('tickets')
    .select('*, events(*), ticket_tiers(*), profiles!tickets_holder_id_fkey(display_name, handle)')
    .order('code', { ascending: true });

  if (result.orderId && result.orderId !== paymentIntentId) {
    ticketsQuery = ticketsQuery.eq('order_id', result.orderId);
  } else {
    ticketsQuery = ticketsQuery.eq('stripe_payment_intent_id', paymentIntentId);
  }

  const { data: ticketsWithRelations } = await ticketsQuery;

  return NextResponse.json({
    tickets: ticketsWithRelations ?? result.tickets,
    orderId: result.orderId,
    alreadyFulfilled: result.alreadyFulfilled,
  });
}
