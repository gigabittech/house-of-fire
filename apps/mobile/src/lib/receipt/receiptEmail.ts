import { formatReceiptCents } from './format';
import type { OrderReceiptData } from './types';

function ticketQty(data: OrderReceiptData): number {
  return data.lineItems.find((i) => !i.isFee && !i.isDiscount)?.qty ?? 1;
}

/** Short plain email — full receipt is only in the PDF attachment. */
export function buildReceiptEmailHtml(data: OrderReceiptData): string {
  const qty = ticketQty(data);
  const ticketPhrase = qty === 1 ? '1 ticket' : `${qty} tickets`;
  const qrLine =
    qty === 1
      ? 'Your ticket QR code is attached as a PNG (show at the door).'
      : `Your ${qty} ticket QR codes are attached as PNGs (one per ticket — show at the door).`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:16px 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#333333;">
  <p style="margin:0 0 12px;">Hi ${escapeHtml(data.buyer.name)},</p>
  <p style="margin:0 0 12px;">
    Thank you for your purchase for ${escapeHtml(data.event.name)} · Edition ${data.event.editionNumber}
    (${ticketPhrase}, ${formatReceiptCents(data.totalCents)} total).
  </p>
  <p style="margin:0 0 12px;">Your receipt is attached as a PDF. ${escapeHtml(qrLine)}</p>
  <p style="margin:0;font-size:13px;color:#666666;">House of Fire · houseoffire.events</p>
</body>
</html>`;
}

export function buildReceiptEmailText(data: OrderReceiptData): string {
  const qty = ticketQty(data);
  const ticketPhrase = qty === 1 ? '1 ticket' : `${qty} tickets`;
  const qrLine =
    qty === 1
      ? 'Your ticket QR code is attached as a PNG (show at the door).'
      : `Your ${qty} ticket QR codes are attached as PNGs (one per ticket — show at the door).`;

  return [
    `Hi ${data.buyer.name},`,
    '',
    `Thank you for your purchase for ${data.event.name} · Edition ${data.event.editionNumber} (${ticketPhrase}, ${formatReceiptCents(data.totalCents)} total).`,
    '',
    'Your receipt is attached as a PDF.',
    qrLine,
    '',
    'House of Fire · houseoffire.events',
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
