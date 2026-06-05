import { formatReceiptCents } from './format';
import type { OrderReceiptData } from './types';

function ticketQty(data: OrderReceiptData): number {
  return data.lineItems.find((i) => !i.isFee && !i.isDiscount)?.qty ?? 1;
}

function ticketPhrase(qty: number): string {
  return qty === 1 ? '1 ticket' : `${qty} tickets`;
}

/** Mentions QR attachments only when they actually made it onto the email. */
function qrAttachmentLine(qrCount: number): string {
  if (qrCount === 0) return '';
  return qrCount === 1
    ? 'Your ticket QR code is attached as a PNG (show at the door).'
    : `Your ${qrCount} ticket QR codes are attached as PNGs (one per ticket — show at the door).`;
}

/** Short plain email — full receipt is only in the PDF attachment. */
export function buildReceiptEmailHtml(data: OrderReceiptData, qrCount: number): string {
  const qty = ticketQty(data);
  const qrLine = qrAttachmentLine(qrCount);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:16px 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#333333;">
  <p style="margin:0 0 12px;">Hi ${escapeHtml(data.buyer.name)},</p>
  <p style="margin:0 0 12px;">
    Thank you for your purchase for ${escapeHtml(data.event.name)} · Edition ${data.event.editionNumber}
    (${ticketPhrase(qty)}, ${formatReceiptCents(data.totalCents)} total).
  </p>
  <p style="margin:0 0 12px;">Your receipt is attached as a PDF.${qrLine ? ` ${escapeHtml(qrLine)}` : ''}</p>
  <p style="margin:0;font-size:13px;color:#666666;">House of Fire · houseoffire.events</p>
</body>
</html>`;
}

export function buildReceiptEmailText(data: OrderReceiptData, qrCount: number): string {
  const qty = ticketQty(data);
  const qrLine = qrAttachmentLine(qrCount);

  return [
    `Hi ${data.buyer.name},`,
    '',
    `Thank you for your purchase for ${data.event.name} · Edition ${data.event.editionNumber} (${ticketPhrase(qty)}, ${formatReceiptCents(data.totalCents)} total).`,
    '',
    'Your receipt is attached as a PDF.',
    ...(qrLine ? [qrLine] : []),
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
