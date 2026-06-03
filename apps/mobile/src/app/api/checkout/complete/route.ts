import { NextResponse, type NextRequest } from 'next/server.js';
import { createServerSupabaseClient } from '../../../../lib/supabase.server.js';
import { stripe } from '../../../../lib/stripe.js';
import { fulfillPaymentIntent } from '../../../../lib/fulfillPayment.js';

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

  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(paymentIntentId);
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

  return NextResponse.json({
    tickets: result.tickets,
    alreadyFulfilled: result.alreadyFulfilled,
  });
}
