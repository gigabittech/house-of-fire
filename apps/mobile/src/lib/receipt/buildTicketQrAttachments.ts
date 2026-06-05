import type { SendEmailAttachment } from '../resend';
import { createServiceRoleClient } from '../supabase.server';
import {
  buildTicketAttachmentPngBase64,
  ticketAttachmentFilename,
  type TicketAttachmentData,
} from './ticketAttachment';

type TicketRow = {
  code: string;
  qr_data: string | null;
  metadata: { holder_name?: string | null } | null;
  events:
    | {
        name: string;
        date: string;
        edition_number: number;
        venue_name: string;
        doors_open: string | null;
        doors_close: string | null;
      }
    | {
        name: string;
        date: string;
        edition_number: number;
        venue_name: string;
        doors_open: string | null;
        doors_close: string | null;
      }[]
    | null;
  ticket_tiers: { display_name: string } | { display_name: string }[] | null;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function holderName(row: TicketRow): string {
  const profile = first(row.profiles);
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  const meta = row.metadata;
  if (meta && typeof meta.holder_name === 'string' && meta.holder_name.trim()) {
    return meta.holder_name.trim();
  }
  return 'Guest';
}

/** One full ticket card PNG per valid ticket on the order. */
export async function buildTicketQrAttachments(orderId: string): Promise<SendEmailAttachment[]> {
  const supabase = await createServiceRoleClient();
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(
      `
      code,
      qr_data,
      metadata,
      events (name, date, edition_number, venue_name, doors_open, doors_close),
      ticket_tiers (display_name),
      profiles!tickets_holder_id_fkey (display_name)
    `,
    )
    .eq('order_id', orderId)
    .eq('status', 'valid')
    .order('code', { ascending: true });

  if (error) {
    console.error('[receipt] Failed to load tickets for attachments:', error);
    return [];
  }

  if (!tickets?.length) return [];

  const rows = tickets as TicketRow[];
  const total = rows.length;
  const attachments: SendEmailAttachment[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row?.qr_data?.trim()) {
      console.warn('[receipt] Ticket missing qr_data:', row?.code);
      continue;
    }

    const ev = first(row.events);
    if (!ev) {
      console.warn('[receipt] Ticket missing event:', row.code);
      continue;
    }

    const tier = first(row.ticket_tiers);

    const payload: TicketAttachmentData = {
      code: row.code,
      qrData: row.qr_data,
      index: i + 1,
      total,
      holderName: holderName(row),
      tierName: tier?.display_name ?? 'GA',
      event: {
        name: ev.name,
        editionNumber: ev.edition_number,
        date: ev.date,
        venueName: ev.venue_name,
        doorsOpen: ev.doors_open,
        doorsClose: ev.doors_close,
      },
    };

    try {
      const content = await buildTicketAttachmentPngBase64(payload);
      attachments.push({
        filename: ticketAttachmentFilename(row.code),
        content,
      });
    } catch (err) {
      console.error('[receipt] Ticket attachment failed for', row.code, err);
    }
  }

  return attachments;
}
