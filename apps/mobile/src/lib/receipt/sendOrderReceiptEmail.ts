import type Stripe from 'stripe';
import { resend } from '../resend';
import { loadReceiptData } from './loadReceiptData';
import { buildTicketQrAttachments } from './buildTicketQrAttachments';
import { buildReceiptEmailHtml, buildReceiptEmailText } from './receiptEmail';
import { renderReceiptPdf } from './renderReceiptPdf';

export async function sendOrderReceiptEmail(params: {
  orderId: string;
  paymentIntent?: Stripe.PaymentIntent | null;
}): Promise<void> {
  const data = await loadReceiptData(params.orderId, params.paymentIntent);
  if (!data?.buyer.email?.trim()) {
    console.warn('[receipt] No buyer email — skipping receipt send for order', params.orderId);
    return;
  }

  const to = data.buyer.email.trim();
  const html = buildReceiptEmailHtml(data);
  const text = buildReceiptEmailText(data);

  const pdfTimeoutMs = 12_000;
  let pdfBase64 = '';
  try {
    const pdf = await Promise.race([
      renderReceiptPdf(data),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('PDF render timeout')), pdfTimeoutMs);
      }),
    ]);
    pdfBase64 = pdf.toString('base64');
  } catch (err) {
    console.error('[receipt] PDF render failed:', err);
    throw new Error('Receipt PDF could not be generated');
  }

  const subject = `Your House of Fire receipt — ${data.event.name} (Th. ${data.event.editionNumber})`;

  const from =
    process.env.RESEND_FROM_EMAIL ?? 'House of Fire <tickets@houseoffire.club>';

  const qrAttachments = await buildTicketQrAttachments(params.orderId);

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      attachments: [
        {
          filename: 'House-of-Fire-Receipt.pdf',
          content: pdfBase64,
        },
        ...qrAttachments,
      ],
    });
    console.info('[receipt] Sent receipt email', {
      orderId: params.orderId,
      to,
      id: result.id,
      qrAttachments: qrAttachments.length,
    });
  } catch (err) {
    console.error('[receipt] Failed to send receipt email:', { to, from, err });
    throw err;
  }
}
