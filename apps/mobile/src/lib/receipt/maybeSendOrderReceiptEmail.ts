import type Stripe from 'stripe';
import { getStripe } from '../stripe';
import { createServiceRoleClient } from '../supabase.server';
import { sendOrderReceiptEmail } from './sendOrderReceiptEmail';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Send receipt at most once per PaymentIntent (Stripe metadata flag).
 * Retries after a failed send; skips duplicate sends on idempotent fulfill.
 */
export async function maybeSendOrderReceiptEmail(
  orderId: string,
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  if (paymentIntent.metadata.receiptEmailSent === 'true') {
    console.info('[receipt] Skipping — already sent for PaymentIntent', paymentIntent.id);
    return;
  }

  let resolvedOrderId = orderId;
  if (!UUID_RE.test(resolvedOrderId)) {
    const supabase = await createServiceRoleClient();
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .maybeSingle();
    if (!order?.id) {
      console.warn('[receipt] No order id for receipt send', paymentIntent.id);
      return;
    }
    resolvedOrderId = order.id;
  }

  await sendOrderReceiptEmail({ orderId: resolvedOrderId, paymentIntent });

  await getStripe().paymentIntents.update(paymentIntent.id, {
    metadata: {
      ...paymentIntent.metadata,
      receiptEmailSent: 'true',
    },
  });
}
