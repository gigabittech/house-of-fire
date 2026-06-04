import type Stripe from 'stripe';
import type { Database } from './database.types';
import { validateTierCapacityForFulfillment } from './checkoutValidation';
import { fetchDiscountCodeById, validateDiscountCodeForCheckout } from './promoCodes';
import { buildTicketQRData } from './qr';
import { maybeSendOrderReceiptEmail } from './receipt/maybeSendOrderReceiptEmail';
import { createServiceRoleClient } from './supabase.server';

type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
type TicketRow = Database['public']['Tables']['tickets']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type EventRow = Database['public']['Tables']['events']['Row'];

function generateTicketCode(edition: number, n: number): string {
  const pad = String(n).padStart(4, '0');
  return `HOF-${String(edition).padStart(2, '0')}-${pad}`;
}

async function trySendReceipt(orderId: string, pi: Stripe.PaymentIntent): Promise<void> {
  try {
    await maybeSendOrderReceiptEmail(orderId, pi);
  } catch (err) {
    console.error('[receipt] maybeSendOrderReceiptEmail failed:', err);
  }
}

export type FulfillResult =
  | { ok: true; tickets: TicketRow[]; orderId: string; alreadyFulfilled: boolean }
  | { ok: false; error: string; status: number };

/**
 * Create order + ticket rows for a succeeded PaymentIntent.
 * Idempotent: keyed on orders.stripe_payment_intent_id.
 */
export async function fulfillPaymentIntent(pi: Stripe.PaymentIntent): Promise<FulfillResult> {
  const {
    userId,
    tierId,
    eventId,
    quantity,
    subtotal,
    fee,
    discountCents,
    holderName,
    holderEmail,
    holderPhone,
  } = pi.metadata;

  if (!userId || !tierId || !eventId) {
    return { ok: false, error: 'Missing payment metadata', status: 400 };
  }

  if (pi.status !== 'succeeded') {
    return { ok: false, error: 'Payment not completed', status: 400 };
  }

  const supabase = await createServiceRoleClient();

  const { data: legacyTickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('stripe_payment_intent_id', pi.id);

  if (legacyTickets && legacyTickets.length > 0) {
    const orderId = legacyTickets[0]?.order_id ?? pi.id;
    await trySendReceipt(orderId, pi);
    return {
      ok: true,
      tickets: legacyTickets as TicketRow[],
      orderId,
      alreadyFulfilled: true,
    };
  }

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_payment_intent_id', pi.id)
    .maybeSingle();

  if (existingOrder) {
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('order_id', existingOrder.id)
      .order('code', { ascending: true });

    await trySendReceipt(existingOrder.id, pi);
    return {
      ok: true,
      tickets: (existingTickets ?? []) as TicketRow[],
      orderId: existingOrder.id,
      alreadyFulfilled: true,
    };
  }

  const qty = parseInt(quantity ?? '1', 10);
  if (!Number.isFinite(qty) || qty < 1 || qty > 4) {
    return { ok: false, error: 'Invalid quantity in payment metadata', status: 400 };
  }

  const capacityCheck = await validateTierCapacityForFulfillment(supabase, tierId, qty);
  if (!capacityCheck.ok) {
    return { ok: false, error: capacityCheck.error, status: capacityCheck.status };
  }

  const { data: evData } = await supabase
    .from('events')
    .select('edition_number, name')
    .eq('id', eventId)
    .single();

  if (!evData) {
    return { ok: false, error: 'Event not found', status: 404 };
  }
  const ev = evData as Pick<EventRow, 'edition_number' | 'name'>;

  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  const amountCents = parseInt(subtotal ?? '0', 10);
  const feeCents = parseInt(fee ?? '0', 10);
  const discount = parseInt(discountCents ?? '0', 10);
  const totalCents = pi.amount;

  const metaCodeId = pi.metadata['codeId']?.trim() || null;
  let discountCodeId: string | null = null;
  if (metaCodeId && discount > 0) {
    const promo = await validateDiscountCodeForCheckout(supabase, {
      tierId,
      subtotalCents: amountCents,
      codeId: metaCodeId,
    });
    if (promo.ok) {
      discountCodeId = promo.code.id;
    } else {
      const dc = await fetchDiscountCodeById(supabase, metaCodeId);
      if (dc) discountCodeId = dc.id;
    }
  }

  const orderInsert: OrderInsert = {
    user_id: userId,
    event_id: eventId,
    tier_id: tierId,
    quantity: qty,
    subtotal_cents: amountCents,
    discount_cents: discount,
    fee_cents: feeCents,
    total_cents: totalCents,
    stripe_payment_intent_id: pi.id,
    status: 'completed',
    discount_code_id: discountCodeId,
  };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderInsert)
    .select('id')
    .single();

  if (orderError) {
    if (orderError.code === '23505') {
      const { data: racedOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_payment_intent_id', pi.id)
        .single();

      if (racedOrder) {
        const { data: racedTickets } = await supabase
          .from('tickets')
          .select('*')
          .eq('order_id', racedOrder.id)
          .order('code', { ascending: true });

        return {
          ok: true,
          tickets: (racedTickets ?? []) as TicketRow[],
          orderId: racedOrder.id,
          alreadyFulfilled: true,
        };
      }
    }
    console.error('Failed to create order:', orderError);
    return { ok: false, error: 'Order insert failed', status: 500 };
  }

  const tickets: TicketInsert[] = [];

  for (let i = 0; i < qty; i++) {
    const n = (count ?? 0) + i + 1;
    const code = generateTicketCode(ev.edition_number, n);
    const qrData = buildTicketQRData(code, eventId);

    tickets.push({
      code,
      event_id: eventId,
      tier_id: tierId,
      holder_id: userId,
      order_id: order.id,
      stripe_payment_intent_id: null,
      stripe_charge_id: null,
      amount_cents: Math.round(amountCents / qty),
      fee_cents: Math.round(feeCents / qty),
      qr_data: qrData,
      status: 'valid',
      used_at: null,
      metadata: {
        holder_name: holderName?.trim() || null,
        holder_email: holderEmail?.trim() || null,
        holder_phone: holderPhone?.trim() || null,
      },
    });
  }

  const { data: inserted, error: ticketError } = await supabase
    .from('tickets')
    .insert(tickets)
    .select();

  if (ticketError) {
    console.error('Failed to create tickets:', ticketError);
    await supabase.from('orders').delete().eq('id', order.id);
    return { ok: false, error: 'DB insert failed', status: 500 };
  }

  const referralCode = pi.metadata['referralCode'];
  if (referralCode) {
    const { data: referralRow } = await supabase
      .from('referrals')
      .select('id')
      .eq('referee_id', userId)
      .eq('converted', false)
      .maybeSingle();

    if (referralRow) {
      await supabase.from('referrals').update({ converted: true }).eq('id', referralRow.id);
    }
  }

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'ticket_purchased',
    title: 'Your ticket is confirmed',
    body: 'Edition ' + ev.edition_number + ' · ' + (qty > 1 ? qty + ' tickets' : 'ticket'),
    link: '/ticket',
  });

  await trySendReceipt(order.id, pi);

  return {
    ok: true,
    tickets: (inserted ?? []) as TicketRow[],
    orderId: order.id,
    alreadyFulfilled: false,
  };
}
