import type Stripe from 'stripe';
import { buildTicketQRData } from './qr.js';
import { createServiceRoleClient } from './supabase.server.js';
import type { Database } from './database.types.js';

type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
type TicketRow = Database['public']['Tables']['tickets']['Row'];
type EventRow = Database['public']['Tables']['events']['Row'];

function generateTicketCode(edition: number, n: number): string {
  const pad = String(n).padStart(4, '0');
  return `HOF-${String(edition).padStart(2, '0')}-${pad}`;
}

export type FulfillResult =
  | { ok: true; tickets: TicketRow[]; alreadyFulfilled: boolean }
  | { ok: false; error: string; status: number };

/**
 * Create ticket rows for a succeeded PaymentIntent. Idempotent: if tickets
 * already exist for this PI, returns them without inserting again.
 */
export async function fulfillPaymentIntent(pi: Stripe.PaymentIntent): Promise<FulfillResult> {
  const { userId, tierId, eventId, quantity, subtotal, fee, holderName, holderEmail } =
    pi.metadata;

  if (!userId || !tierId || !eventId) {
    return { ok: false, error: 'Missing payment metadata', status: 400 };
  }

  if (pi.status !== 'succeeded') {
    return { ok: false, error: 'Payment not completed', status: 400 };
  }

  const supabase = await createServiceRoleClient();

  const { data: existing } = await supabase
    .from('tickets')
    .select('*')
    .eq('stripe_payment_intent_id', pi.id);

  if (existing && existing.length > 0) {
    return { ok: true, tickets: existing as TicketRow[], alreadyFulfilled: true };
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

  const qty = parseInt(quantity ?? '1', 10);
  const amountCents = parseInt(subtotal ?? '0', 10);
  const feeCents = parseInt(fee ?? '0', 10);
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
      stripe_payment_intent_id: i === 0 ? pi.id : null,
      stripe_charge_id: null,
      amount_cents: Math.round(amountCents / qty),
      fee_cents: Math.round(feeCents / qty),
      qr_data: qrData,
      status: 'valid',
      used_at: null,
    });
  }

  const { data: inserted, error } = await supabase.from('tickets').insert(tickets).select();
  if (error) {
    console.error('Failed to create tickets:', error);
    return { ok: false, error: 'DB insert failed', status: 500 };
  }

  const codeId = pi.metadata['codeId'];
  if (codeId) {
    await supabase.rpc('increment_code_uses', { code_id: codeId }).then(
      () => {},
      () => {},
    );
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

  if (holderEmail) {
    const codes = tickets.map((t) => t.code).join(', ');
    console.log(
      `[ticket-confirmed] to=${holderEmail} name=${holderName ?? 'guest'} codes=${codes}`,
    );
  }

  return {
    ok: true,
    tickets: (inserted ?? []) as TicketRow[],
    alreadyFulfilled: false,
  };
}
