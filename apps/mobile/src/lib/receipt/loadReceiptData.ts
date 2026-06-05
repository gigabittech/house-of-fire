import type Stripe from 'stripe';
import type { Database } from '../database.types';
import { getStripe } from '../stripe';
import { createServiceRoleClient } from '../supabase.server';
import {
  feePercentLabel,
  formatEventDateTime,
  formatIssuedDate,
  formatReceiptCode,
} from './format';
import type { OrderReceiptData, ReceiptLineItem } from './types';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type EventRow = Database['public']['Tables']['events']['Row'];
type TierRow = Database['public']['Tables']['ticket_tiers']['Row'];
type TicketRow = Database['public']['Tables']['tickets']['Row'];

type TicketMeta = {
  holder_name?: string | null;
  holder_email?: string | null;
  holder_phone?: string | null;
};

function holderFromTicket(t: TicketRow, fallbackName: string): string {
  const meta = (t.metadata ?? {}) as TicketMeta;
  if (typeof meta.holder_name === 'string' && meta.holder_name.trim()) {
    return meta.holder_name.trim();
  }
  return fallbackName;
}

function buildLineItems(
  tickets: TicketRow[],
  tierName: string,
  holderName: string,
  feeCents: number,
  discountCents: number,
  subtotalCents: number,
): ReceiptLineItem[] {
  const items: ReceiptLineItem[] = [];

  const qty = tickets.length;
  const lineSubtotalCents = tickets.reduce((sum, t) => sum + t.amount_cents, 0);
  const unitCents = qty > 0 ? Math.round(lineSubtotalCents / qty) : 0;
  const first = tickets[0];
  const holder = first ? holderFromTicket(first, holderName) : holderName;
  const ticketIds = tickets.map((t) => formatReceiptCode(t.code));

  items.push({
    description: tierName,
    subline:
      qty === 1
        ? `Holder: ${holder} · ID: ${ticketIds[0]}`
        : `Holder: ${holder} · IDs: ${ticketIds.join(', ')}`,
    qty,
    unitCents,
    totalCents: lineSubtotalCents,
  });

  if (discountCents > 0) {
    items.push({
      description: 'Discount',
      qty: 1,
      unitCents: -discountCents,
      totalCents: -discountCents,
      isDiscount: true,
    });
  }

  if (feeCents > 0) {
    items.push({
      description: feePercentLabel(subtotalCents, feeCents),
      qty: 1,
      unitCents: feeCents,
      totalCents: feeCents,
      isFee: true,
    });
  }

  return items;
}

async function buildPaymentLine(
  order: OrderRow,
  paymentIntent?: Stripe.PaymentIntent | null,
): Promise<string> {
  let pi = paymentIntent;
  if (!pi && order.stripe_payment_intent_id) {
    try {
      pi = await getStripe().paymentIntents.retrieve(order.stripe_payment_intent_id, {
        expand: ['latest_charge'],
      });
    } catch {
      pi = null;
    }
  }

  const paidDate = formatIssuedDate(order.created_at);
  if (!pi?.latest_charge || typeof pi.latest_charge === 'string') {
    return `Paid via Stripe on ${paidDate}`;
  }

  const charge = pi.latest_charge as Stripe.Charge;
  const card = charge.payment_method_details?.card;
  if (card?.brand && card.last4) {
    const brand = card.brand.charAt(0).toUpperCase() + card.brand.slice(1);
    return `Charged to ${brand} ···· ${card.last4} on ${paidDate}`;
  }

  return `Paid via Stripe on ${paidDate}`;
}

export async function loadReceiptData(
  orderId: string,
  paymentIntent?: Stripe.PaymentIntent | null,
): Promise<OrderReceiptData | null> {
  const supabase = await createServiceRoleClient();

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) return null;
  const orderRow = order as OrderRow;

  const [{ data: ev }, { data: tier }, { data: tickets }] = await Promise.all([
    supabase.from('events').select('*').eq('id', orderRow.event_id).single(),
    supabase.from('ticket_tiers').select('*').eq('id', orderRow.tier_id).single(),
    supabase.from('tickets').select('*').eq('order_id', orderId).order('code', { ascending: true }),
  ]);

  if (!ev || !tier || !tickets?.length) return null;

  const event = ev as EventRow;
  const tierRow = tier as TierRow;
  const ticketRows = tickets as TicketRow[];
  const primaryTicket = ticketRows[0];
  if (!primaryTicket) return null;

  const piMeta = paymentIntent?.metadata ?? {};
  const buyerName =
    (typeof piMeta.holderName === 'string' && piMeta.holderName.trim()) ||
    holderFromTicket(primaryTicket, 'Guest');

  let buyerEmail = (typeof piMeta.holderEmail === 'string' && piMeta.holderEmail.trim()) || '';
  if (!buyerEmail) {
    for (const t of ticketRows) {
      const fromTicket = (t.metadata as TicketMeta)?.holder_email?.trim();
      if (fromTicket) {
        buyerEmail = fromTicket;
        break;
      }
    }
  }
  if (!buyerEmail && orderRow.user_id) {
    try {
      const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(
        orderRow.user_id,
      );
      if (!authErr) {
        buyerEmail = authUser?.user?.email?.trim() ?? '';
      }
    } catch (err) {
      console.warn('[receipt] Could not load auth email for buyer:', err);
    }
  }

  const buyerPhone =
    (typeof piMeta.holderPhone === 'string' && piMeta.holderPhone.trim()) ||
    ((primaryTicket.metadata as TicketMeta)?.holder_phone?.trim() ?? '');

  const primaryCode = primaryTicket.code;
  const paymentLine = await buildPaymentLine(orderRow, paymentIntent);

  return {
    receiptCode: formatReceiptCode(primaryCode),
    issuedAt: orderRow.created_at,
    buyer: {
      name: buyerName,
      email: buyerEmail,
      phone: buyerPhone,
    },
    event: {
      name: event.name,
      editionNumber: event.edition_number,
      dateLine: formatEventDateTime(event.date, event.doors_open),
      venueName: event.venue_name,
      venueAddress: event.venue_address,
    },
    lineItems: buildLineItems(
      ticketRows,
      tierRow.display_name,
      buyerName,
      orderRow.fee_cents,
      orderRow.discount_cents,
      orderRow.subtotal_cents,
    ),
    tickets: ticketRows
      .filter((t) => t.status === 'valid')
      .map((t) => ({ code: t.code, qrData: t.qr_data })),
    subtotalCents: orderRow.subtotal_cents,
    discountCents: orderRow.discount_cents,
    feeCents: orderRow.fee_cents,
    taxCents: 0,
    totalCents: orderRow.total_cents,
    feeLabel: feePercentLabel(orderRow.subtotal_cents, orderRow.fee_cents),
    paymentLine,
  };
}
