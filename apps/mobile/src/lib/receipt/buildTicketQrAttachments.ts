import { renderTicketQrPngBase64 } from '../qr';
import type { SendEmailAttachment } from '../resend';
import type { ReceiptTicket } from './types';

function ticketQrFilename(code: string): string {
  const safe = code.replace(/[^A-Za-z0-9-]/g, '-');
  return `Ticket-${safe}-QR.png`;
}

/**
 * One PNG attachment per valid ticket on the order (confirmation email).
 * Tickets come from the already-loaded receipt data so the attachments can
 * never disagree with the receipt itself. Renders run in parallel; a ticket
 * that fails to render is logged and skipped, never blocking the email.
 */
export async function buildTicketQrAttachments(
  tickets: ReceiptTicket[],
): Promise<SendEmailAttachment[]> {
  const rendered = await Promise.all(
    tickets.map(async (ticket): Promise<SendEmailAttachment | null> => {
      if (!ticket.qrData?.trim()) {
        console.warn('[receipt] Ticket missing qr_data:', ticket.code);
        return null;
      }
      try {
        return {
          filename: ticketQrFilename(ticket.code),
          content: await renderTicketQrPngBase64(ticket.qrData),
        };
      } catch (err) {
        console.error('[receipt] QR PNG failed for ticket', ticket.code, err);
        return null;
      }
    }),
  );

  return rendered.filter((a): a is SendEmailAttachment => a !== null);
}
