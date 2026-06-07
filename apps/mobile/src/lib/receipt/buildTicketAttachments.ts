import type { SendEmailAttachment } from '../resend';
import {
  buildTicketAttachmentPngBase64,
  ticketAttachmentFilename,
  type TicketAttachmentData,
} from './ticketAttachment';
import type { ReceiptTicket } from './types';

/**
 * One full ticket pass PNG per valid ticket, attached to the receipt email.
 * Renders run in parallel; failures are logged and skipped so they never block the email.
 */
export async function buildTicketAttachments(
  tickets: ReceiptTicket[],
): Promise<SendEmailAttachment[]> {
  const rendered = await Promise.all(
    tickets.map(async (ticket): Promise<SendEmailAttachment | null> => {
      if (!ticket.qrData?.trim()) {
        console.warn('[receipt] Ticket missing qr_data:', ticket.code);
        return null;
      }
      try {
        const attachmentData: TicketAttachmentData = {
          code: ticket.code,
          qrData: ticket.qrData,
          index: ticket.index,
          total: ticket.total,
          holderName: ticket.holderName,
          tierName: ticket.tierName,
          event: ticket.event,
        };
        return {
          filename: ticketAttachmentFilename(ticket.code),
          content: await buildTicketAttachmentPngBase64(attachmentData),
        };
      } catch (err) {
        console.error('[receipt] Ticket PNG failed for ticket', ticket.code, err);
        return null;
      }
    }),
  );

  return rendered.filter((a): a is SendEmailAttachment => a !== null);
}
