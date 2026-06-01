import { NextResponse, type NextRequest } from 'next/server.js';
import { stripe } from '../../../../lib/stripe.js';
import { createServiceRoleClient } from '../../../../lib/supabase.server.js';
import { buildTicketQRData } from '../../../../lib/qr.js';
import type { Database } from '../../../../lib/database.types.js';

type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
type EventRow = Database['public']['Tables']['events']['Row'];

function generateTicketCode(edition: number, n: number): string {
  const pad = String(n).padStart(4, '0');
  return `HOF-${String(edition).padStart(2, '0')}-${pad}`;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const { userId, tierId, eventId, quantity, subtotal, fee, holderName, holderEmail } =
      pi.metadata;

    if (!userId || !tierId || !eventId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();

    // Get event for edition number
    const { data: evData } = await supabase
      .from('events')
      .select('edition_number, name')
      .eq('id', eventId)
      .single();

    if (!evData) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    const ev = evData as Pick<EventRow, 'edition_number' | 'name'>;

    // Count existing tickets for this event to generate sequential codes
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

    const { error } = await supabase.from('tickets').insert(tickets);
    if (error) {
      console.error('Failed to create tickets:', error);
      return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
    }

    // Increment promo code uses if one was applied
    const codeId = pi.metadata['codeId'];
    if (codeId) {
      await supabase.rpc('increment_code_uses', { code_id: codeId }).then(
        () => {},
        () => {},
      );
    }

    // Track referral conversion if a referral code was used at checkout
    const referralCode = pi.metadata['referralCode'];
    if (referralCode) {
      const { data: referralRow } = await supabase
        .from('referrals')
        .select('id')
        .eq('referee_id', userId)
        .eq('converted', false)
        .maybeSingle();

      if (referralRow) {
        await supabase
          .from('referrals')
          .update({ converted: true })
          .eq('id', referralRow.id);
      }
    }

    // Insert a purchase notification for the ticket holder
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'ticket_purchased',
      title: 'Your ticket is confirmed',
      body:
        'Edition ' +
        ev.edition_number +
        ' · ' +
        (qty > 1 ? qty + ' tickets' : 'ticket'),
      link: '/ticket',
    });

    // Ticket confirmation — logged server-side.
    // Supabase Auth handles auth emails (OTP / magic link) natively.
    // Wire a transactional email service here later if needed.
    if (holderEmail) {
      const codes = tickets.map((t) => t.code).join(', ');
      console.log(
        `[ticket-confirmed] to=${holderEmail} name=${holderName ?? 'guest'} codes=${codes}`,
      );
    }
  }

  return NextResponse.json({ received: true });
}
