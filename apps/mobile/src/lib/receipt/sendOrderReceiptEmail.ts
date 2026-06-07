import type Stripe from 'stripe';
import { resend } from '../resend';
import { buildTicketAttachments } from './buildTicketAttachments';
import { loadReceiptData } from './loadReceiptData';
import { buildReceiptEmailHtml, buildReceiptEmailText } from './receiptEmail';
import { renderReceiptPdf } from './renderReceiptPdf';

export async function sendOrderReceiptEmail(params: {
  orderId: string;
  paymentIntent?: Stripe.PaymentIntent | null;
  existingLogId?: string;
}): Promise<void> {
  const data = await loadReceiptData(params.orderId, params.paymentIntent);
  if (!data?.buyer.email?.trim()) {
    console.warn('[receipt] No buyer email — skipping receipt send for order', params.orderId);
    return;
  }

  const to = data.buyer.email.trim();

  // PDF render and ticket pass renders are independent — run them concurrently.
  // Ticket render failures degrade to "no ticket attachments" and must never block the email.
  const pdfTimeoutMs = 12_000;
  const pdfPromise = Promise.race([
    renderReceiptPdf(data),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('PDF render timeout')), pdfTimeoutMs);
    }),
  ]);
  const ticketPromise = buildTicketAttachments(data.tickets).catch((err) => {
    console.error('[receipt] Ticket attachment build failed:', err);
    return [];
  });

  let pdfBase64 = '';
  try {
    const pdf = await pdfPromise;
    pdfBase64 = pdf.toString('base64');
  } catch (err) {
    console.error('[receipt] PDF render failed:', err);
    throw new Error('Receipt PDF could not be generated');
  }
  const ticketAttachments = await ticketPromise;

  // Copy is built after the attachments so it reflects what actually shipped.
  const html = buildReceiptEmailHtml(data, ticketAttachments.length);
  const text = buildReceiptEmailText(data, ticketAttachments.length);

  const subject = `Your House of Fire receipt — ${data.event.name} (Th. ${data.event.editionNumber})`;

  const from = process.env.RESEND_FROM_EMAIL ?? 'House of Fire <tickets@houseoffire.club>';

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
        ...ticketAttachments,
      ],
      log: {
        existingLogId: params.existingLogId,
        kind: 'receipt',
        projectId: data.event.id,
        meta: {
          orderId: params.orderId,
          attachments: { pdf: true, tickets: ticketAttachments.length },
        },
      },
    });
    console.info('[receipt] Sent receipt email', {
      orderId: params.orderId,
      to,
      id: result.id,
      ticketAttachments: ticketAttachments.length,
    });
  } catch (err) {
    console.error('[receipt] Failed to send receipt email:', { to, from, err });
    throw err;
  }
}
