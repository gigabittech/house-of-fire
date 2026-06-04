import { renderTicketQrPngBase64 } from '../qr';
import type { SendEmailAttachment } from '../resend';
import { createServiceRoleClient } from '../supabase.server';

function ticketQrFilename(code: string): string {
  const safe = code.replace(/[^A-Za-z0-9-]/g, '-');
  return `Ticket-${safe}-QR.png`;
}

/** One PNG attachment per valid ticket on the order (confirmation email). */
export async function buildTicketQrAttachments(orderId: string): Promise<SendEmailAttachment[]> {
  const supabase = await createServiceRoleClient();
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('code, qr_data')
    .eq('order_id', orderId)
    .eq('status', 'valid')
    .order('code', { ascending: true });

  if (error) {
    console.error('[receipt] Failed to load tickets for QR attachments:', error);
    return [];
  }

  if (!tickets?.length) return [];

  const attachments: SendEmailAttachment[] = [];

  for (const ticket of tickets) {
    if (!ticket.qr_data?.trim()) {
      console.warn('[receipt] Ticket missing qr_data:', ticket.code);
      continue;
    }
    try {
      const content = await renderTicketQrPngBase64(ticket.qr_data);
      attachments.push({
        filename: ticketQrFilename(ticket.code),
        content,
      });
    } catch (err) {
      console.error('[receipt] QR PNG failed for ticket', ticket.code, err);
    }
  }

  return attachments;
}
