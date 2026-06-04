import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../../../lib/database.types';
import { maybeReleasePromoForOrder } from '../../../../../lib/promoCodes';
import { getStripe } from '../../../../../lib/stripe';
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from '../../../../../lib/supabase.server';

type TicketRow = Database['public']['Tables']['tickets']['Row'];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reason } = (await request.json()) as { reason?: string };

  const { data: ticketData } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .eq('holder_id', user.id)
    .eq('status', 'valid')
    .single();

  if (!ticketData)
    return NextResponse.json({ error: 'Ticket not found or not refundable' }, { status: 404 });

  const ticket = ticketData as TicketRow;

  let paymentIntentId = ticket.stripe_payment_intent_id;
  if (!paymentIntentId && ticket.order_id) {
    const { data: order } = await supabase
      .from('orders')
      .select('stripe_payment_intent_id')
      .eq('id', ticket.order_id)
      .single();
    paymentIntentId = order?.stripe_payment_intent_id ?? null;
  }

  let stripeRefundId: string | null = null;
  if (paymentIntentId) {
    try {
      const refund = await getStripe().refunds.create({
        payment_intent: paymentIntentId,
        amount: ticket.amount_cents + ticket.fee_cents,
        reason: 'requested_by_customer',
      });
      stripeRefundId = refund.id;
    } catch (stripeErr) {
      const msg = stripeErr instanceof Error ? stripeErr.message : 'Stripe refund failed';
      console.error('[refund] Stripe error:', msg);
      return NextResponse.json({ error: `Stripe refund failed: ${msg}` }, { status: 502 });
    }
  }

  // Mark ticket as refunded
  await supabase.from('tickets').update({ status: 'refunded' }).eq('id', id);

  // Record the refund request
  const { data: refundRequest, error } = await supabase
    .from('refund_requests')
    .insert({
      ticket_id: id,
      user_id: user.id,
      reason: reason ?? null,
      status: stripeRefundId ? 'processed' : 'pending',
      stripe_refund_id: stripeRefundId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (ticket.order_id) {
    const service = await createServiceRoleClient();
    await maybeReleasePromoForOrder(service, ticket.order_id);
  }

  console.log(`[refund] ticket=${id} stripe_refund=${stripeRefundId ?? 'manual'} user=${user.id}`);
  return NextResponse.json({ request: refundRequest }, { status: 201 });
}
