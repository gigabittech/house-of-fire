import { NextResponse, type NextRequest } from 'next/server.js';
import { stripe } from '../../../../lib/stripe.js';
import { fulfillPaymentIntent } from '../../../../lib/fulfillPayment.js';

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
    const result = await fulfillPaymentIntent(event.data.object);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
  }

  return NextResponse.json({ received: true });
}
