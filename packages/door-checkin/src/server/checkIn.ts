import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyTicketQRData } from './qr';

export type CheckInRequest = {
  code: string;
  client_scan_id?: string;
  scanned_at?: string;
  event_id?: string;
};

export type CheckInResponse = {
  status: number;
  body: Record<string, unknown>;
};

type ProfileShape = { display_name: string; handle: string | null };
type TierShape = { display_name: string; name: string };

function holderNameFrom(
  profile: ProfileShape | null,
  meta: Record<string, unknown> | null,
): string {
  const metaName = meta
    ? `${String(meta['first_name'] ?? '')} ${String(meta['last_name'] ?? '')}`.trim()
    : '';
  return profile?.display_name ?? (metaName || 'Guest');
}

async function fetchAttendee(
  supabase: SupabaseClient,
  ticket: { holder_id: string | null; tier_id: string; metadata: unknown },
) {
  const [profileRes, tierRes] = await Promise.all([
    ticket.holder_id
      ? supabase.from('profiles').select('display_name, handle').eq('id', ticket.holder_id).single()
      : Promise.resolve({ data: null, error: null }),
    supabase.from('ticket_tiers').select('display_name, name').eq('id', ticket.tier_id).single(),
  ]);

  const profile = profileRes.data as ProfileShape | null;
  const tier = tierRes.data as TierShape | null;
  const meta = ticket.metadata as Record<string, unknown> | null;

  return {
    holder: { display_name: holderNameFrom(profile, meta), handle: profile?.handle ?? null },
    tier,
  };
}

export async function performDoorCheckIn(
  supabase: SupabaseClient,
  input: CheckInRequest,
): Promise<CheckInResponse> {
  const { code: rawCode, client_scan_id: clientScanId, event_id: eventIdFilter } = input;

  if (!rawCode?.trim()) {
    return { status: 400, body: { error: 'Missing required field: code' } };
  }

  let lookupCode = rawCode.trim();
  let isJsonPayload = false;
  try {
    JSON.parse(rawCode);
    isJsonPayload = true;
  } catch {
    // plain string
  }

  if (isJsonPayload) {
    try {
      const parsed = JSON.parse(rawCode) as { code?: unknown };
      if (typeof parsed.code === 'string' && parsed.code.length > 0) {
        lookupCode = parsed.code;
      }
      if (!verifyTicketQRData(rawCode)) {
        return { status: 400, body: { error: 'Invalid QR signature', outcome: 'invalid_qr' } };
      }
    } catch {
      return { status: 400, body: { error: 'Invalid QR data', outcome: 'invalid_qr' } };
    }
  }

  if (clientScanId) {
    const { data: prior } = await supabase
      .from('door_check_in_scans')
      .select('outcome, ticket_id, code, used_at')
      .eq('client_scan_id', clientScanId)
      .maybeSingle();

    if (prior) {
      const { data: ticket } = await supabase
        .from('tickets')
        .select('id, code, holder_id, tier_id, metadata')
        .eq('id', prior.ticket_id)
        .maybeSingle();

      if (ticket) {
        const attendee = await fetchAttendee(supabase, ticket);
        return {
          status: 200,
          body: {
            outcome: prior.outcome,
            ok: true,
            idempotent: true,
            ticket_id: ticket.id,
            code: ticket.code,
            used_at: prior.used_at,
            checkedInAt: prior.used_at,
            holder: attendee.holder,
            tier: attendee.tier,
          },
        };
      }
    }
  }

  const codeUpper = lookupCode.toUpperCase();

  const { data: ticket, error: lookupError } = await supabase
    .from('tickets')
    .select('id, code, status, used_at, checked_in_at, holder_id, tier_id, event_id, metadata')
    .or(`code.eq.${codeUpper},qr_data.eq.${rawCode}`)
    .maybeSingle();

  if (lookupError) {
    return { status: 500, body: { error: lookupError.message } };
  }

  if (ticket === null) {
    return { status: 404, body: { error: 'Ticket not found', outcome: 'not_found' } };
  }

  if (eventIdFilter && ticket.event_id !== eventIdFilter) {
    return {
      status: 409,
      body: { error: 'Ticket is for a different event', outcome: 'wrong_event' },
    };
  }

  if (ticket.status === 'used' || ticket.used_at || ticket.checked_in_at) {
    const attendee = await fetchAttendee(supabase, ticket);
    return {
      status: 409,
      body: {
        error: 'Already checked in',
        outcome: 'already_used',
        checkedInAt: ticket.checked_in_at ?? ticket.used_at,
        holder: attendee.holder,
        tier: attendee.tier,
        code: ticket.code,
      },
    };
  }

  if (ticket.status !== 'valid') {
    return {
      status: 409,
      body: { error: `Ticket is ${ticket.status}`, outcome: 'invalid_status' },
    };
  }

  const usedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('tickets')
    .update({ status: 'used', used_at: usedAt, checked_in_at: usedAt })
    .eq('id', ticket.id)
    .eq('status', 'valid')
    .is('used_at', null)
    .select('id')
    .maybeSingle();

  if (updateError) {
    return { status: 500, body: { error: updateError.message } };
  }

  if (!updated) {
    const attendee = await fetchAttendee(supabase, ticket);
    return {
      status: 409,
      body: {
        error: 'Already checked in',
        outcome: 'already_used',
        holder: attendee.holder,
        tier: attendee.tier,
        code: ticket.code,
      },
    };
  }

  if (clientScanId) {
    await supabase.from('door_check_in_scans').upsert(
      {
        client_scan_id: clientScanId,
        ticket_id: ticket.id,
        event_id: ticket.event_id,
        code: ticket.code,
        scanned_at: input.scanned_at ?? usedAt,
        used_at: usedAt,
        outcome: 'admitted',
      },
      { onConflict: 'client_scan_id' },
    );
  }

  const attendee = await fetchAttendee(supabase, ticket);

  return {
    status: 200,
    body: {
      outcome: 'admitted',
      ok: true,
      ticket_id: ticket.id,
      code: ticket.code,
      used_at: usedAt,
      checkedInAt: usedAt,
      holder: attendee.holder,
      tier: attendee.tier,
    },
  };
}
