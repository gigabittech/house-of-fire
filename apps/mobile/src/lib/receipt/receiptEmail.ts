import { formatIssuedDate, formatReceiptCents } from './format';
import type { OrderReceiptData } from './types';

/** ImgBB-hosted House of Fire wordmark. */
export const HOF_EMBLEM_URL = 'https://i.ibb.co.com/mVWGxtVM/hof-emblem.png';
export const HOF_EMBLEM_WIDTH = 200;

function buildEmailLogoHtml(): string {
  return `<tr><td align="center" style="padding:0 0 28px;">
          <img src="${escapeHtml(HOF_EMBLEM_URL)}" width="${HOF_EMBLEM_WIDTH}" alt="House of Fire" style="display:block;margin:0 auto;border:0;"/>
        </td></tr>`;
}

function ticketQty(data: OrderReceiptData): number {
  return data.lineItems.find((i) => !i.isFee && !i.isDiscount)?.qty ?? 1;
}

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://houseoffire.events').replace(/\/$/, '');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildLineItemsHtml(data: OrderReceiptData): string {
  const rows = data.lineItems
    .map((item) => {
      const label =
        item.qty > 1 && !item.isFee && !item.isDiscount
          ? `${escapeHtml(item.description)} × ${item.qty}`
          : escapeHtml(item.description);
      const amount = formatReceiptCents(Math.abs(item.totalCents));
      const displayAmount = item.isDiscount ? `−${amount}` : amount;
      const color = item.isDiscount ? '#4CAF6E' : '#F0EDE6';
      return `<tr>
  <td style="padding:10px 0;border-bottom:1px solid #2A2826;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#cdcabf;">${label}</td>
  <td align="right" style="padding:10px 0;border-bottom:1px solid #2A2826;font-family:'JetBrains Mono','Courier New',monospace;font-size:14px;color:${color};">${displayAmount}</td>
</tr>`;
    })
    .join('');

  return `${rows}<tr>
  <td style="padding:12px 0 0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#F0EDE6;">Total paid</td>
  <td align="right" style="padding:12px 0 0;font-family:'JetBrains Mono','Courier New',monospace;font-size:15px;font-weight:600;color:#F5942A;">${formatReceiptCents(data.totalCents)}</td>
</tr>`;
}

function qrAttachmentLine(qty: number): string {
  return qty === 1
    ? 'Your receipt PDF and ticket image are attached — show the QR code at the door.'
    : `Your receipt PDF and ${qty} ticket images are attached (one PNG per ticket). Show your QR at the door.`;
}

/** Branded confirmation email — matches House of Fire auth email UI. PDF + QR PNGs attached separately. */
export function buildReceiptEmailHtml(data: OrderReceiptData): string {
  const qty = ticketQty(data);
  const appUrl = appBaseUrl();
  const eventTitle = `${data.event.name} · Theme ${data.event.editionNumber}`;
  const venueLine = [data.event.venueName, data.event.venueAddress].filter(Boolean).join(' · ');
  const issued = formatIssuedDate(data.issuedAt);

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="color-scheme" content="dark"/>
<meta name="supported-color-schemes" content="dark"/>
<title>House of Fire</title>
<!--[if mso]><style>* {font-family:Arial,sans-serif !important;}</style><![endif]-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">
<style>
  body{margin:0;padding:0;background:#0A0A08;}
  a{text-decoration:none;}
  @media (max-width:620px){
    .container{width:100% !important;}
    .pad{padding-left:24px !important;padding-right:24px !important;}
    .h1{font-size:30px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#0A0A08;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0A0A08;">Your House of Fire ticket purchase is confirmed.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0A0A08" style="background:#0A0A08;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px;max-width:600px;">

        ${buildEmailLogoHtml()}

        <tr><td bgcolor="#141412" style="background:#141412;border:1px solid #2A2826;border-radius:18px;overflow:hidden;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td height="3" style="height:3px;line-height:3px;font-size:0;background:#E8651A;background:linear-gradient(90deg,#F5942A,#E8651A 45%,#C4401A);">&nbsp;</td>
          </tr></table>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td class="pad" style="padding:44px 48px 46px;">

              <p style="margin:0 0 18px;font-family:'JetBrains Mono','Courier New',monospace;font-size:12px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:#E8651A;">Order confirmed</p>

              <h1 class="h1" style="margin:0 0 18px;font-family:'Clash Display','Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:36px;line-height:1.05;letter-spacing:-0.02em;color:#F0EDE6;">You're on the list.</h1>

              <p style="margin:0 0 16px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.65;color:#cdcabf;">Hi ${escapeHtml(data.buyer.name)} — thanks for your purchase. Your ${qty === 1 ? 'ticket' : `${qty} tickets`} for <strong style="color:#F0EDE6;">${escapeHtml(eventTitle)}</strong> ${qty === 1 ? 'is' : 'are'} confirmed.</p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;background:#1E1C19;border:1px solid #2A2826;border-radius:12px;">
                <tr><td style="padding:18px 20px;">
                  <p style="margin:0 0 8px;font-family:'JetBrains Mono','Courier New',monospace;font-size:10px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:#8A8880;">Event</p>
                  <p style="margin:0 0 4px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#F0EDE6;">${escapeHtml(eventTitle)}</p>
                  <p style="margin:0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.55;color:#cdcabf;">${escapeHtml(data.event.dateLine)}${venueLine ? `<br/>${escapeHtml(venueLine)}` : ''}</p>
                </td></tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;">
                ${buildLineItemsHtml(data)}
              </table>

              <p style="margin:0 0 6px;font-family:'JetBrains Mono','Courier New',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8A8880;">Receipt · ${escapeHtml(data.receiptCode)}</p>
              <p style="margin:0 0 22px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.55;color:#8A8880;">${escapeHtml(data.paymentLine)} · Issued ${escapeHtml(issued)}</p>

       

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="background:rgba(232,162,26,0.08);border:1px solid rgba(232,162,26,0.25);border-left:3px solid #E8A21A;border-radius:0 10px 10px 0;padding:14px 18px;">
                  <p style="margin:0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;color:#cdcabf;">${escapeHtml(qrAttachmentLine(qty))}</p>
                </td></tr>
              </table>

            </td>
          </tr></table>
        </td></tr>

        <tr><td class="pad" style="padding:30px 48px 8px;">
          <p style="margin:0 0 8px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#8A8880;">
            House of Fire &middot; Junkyard Social Club &middot; 1650 Walnut St, Boulder CO
          </p>
          <p style="margin:0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#5A574F;">
            Sent to ${escapeHtml(data.buyer.email)} for your ticket purchase.
            <a href="${escapeHtml(appUrl)}" target="_blank" style="color:#C9942A;">Visit House of Fire</a>
          </p>
          <p style="margin:14px 0 0;font-family:'JetBrains Mono','Courier New',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#5A574F;">
            &copy; 2026 House of Fire &middot; houseoffire.events
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildReceiptEmailText(data: OrderReceiptData): string {
  const qty = ticketQty(data);
  const ticketPhrase = qty === 1 ? '1 ticket' : `${qty} tickets`;
  const appUrl = appBaseUrl();
  const qrLine =
    qty === 1
      ? 'Your ticket is attached as a PNG (show the QR at the door).'
      : `Your ${qty} tickets are attached as PNGs (one per ticket — show the QR at the door).`;

  return [
    `Hi ${data.buyer.name},`,
    '',
    `You're on the list — thank you for your purchase.`,
    '',
    `${data.event.name} · Theme ${data.event.editionNumber}`,
    data.event.dateLine,
    [data.event.venueName, data.event.venueAddress].filter(Boolean).join(' · '),
    '',
    `${ticketPhrase} · ${formatReceiptCents(data.totalCents)} total`,
    `Receipt: ${data.receiptCode}`,
    data.paymentLine,
    '',
    'Your receipt is attached as a PDF.',
    qrLine,
    '',
    `View your tickets: ${appUrl}/ticket`,
    '',
    'House of Fire · houseoffire.events',
  ].join('\n');
}
