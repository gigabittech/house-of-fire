import { NextResponse, type NextRequest } from 'next/server.js';
import { createServerSupabaseClient } from '../../../../lib/supabase.server.js';
import { verifyTicketQRData } from '../../../../lib/qr.js';
import type { Json } from '../../../../lib/database.types.js';

type ProfileShape = { display_name: string; handle: string };
type TierShape = { display_name: string; name: string };

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { code?: string };
  const rawQR = body.code?.trim() ?? '';

  if (!rawQR) {
    return NextResponse.json({ error: 'Ticket code required' }, { status: 400 });
  }

  // Verify HMAC signature for JSON QR payloads.
  // verifyTicketQRData returns true for: valid sig, or JSON with no sig (legacy JSON ticket).
  // It returns false for: JSON with an invalid/tampered sig.
  // Non-JSON plain string codes are legacy and pass through without HMAC verification.
  let isJsonPayload = false;
  try {
    JSON.parse(rawQR);
    isJsonPayload = true;
  } catch {
    // plain string code — not a JSON payload, skip HMAC check
  }

  if (isJsonPayload && !verifyTicketQRData(rawQR)) {
    return NextResponse.json({ error: 'Invalid or tampered QR code' }, { status: 400 });
  }

  // Extract ticket code: if JSON with a code field, use that; otherwise treat the whole string as the code
  let ticketCode = rawQR;
  if (isJsonPayload) {
    try {
      const parsed = JSON.parse(rawQR) as { code?: unknown };
      if (typeof parsed.code === 'string' && parsed.code.length > 0) {
        ticketCode = parsed.code;
      }
    } catch {
      // shouldn't happen since isJsonPayload is true, but guard anyway
    }
  }

  const code = ticketCode.toUpperCase();

  const supabase = await createServerSupabaseClient();

  // Query ticket by code without foreign-key joins (the DB types don't carry the FK relation for holder_id).
  // We'll fetch the profile separately if holder_id is present.
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('id, code, status, checked_in_at, used_at, holder_id, tier_id, metadata')
    .eq('code', code)
    .single();

  if (error ?? !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  if (ticket.checked_in_at) {
    return NextResponse.json(
      { error: 'Already checked in', checkedInAt: ticket.checked_in_at },
      { status: 409 },
    );
  }

  if (ticket.status !== 'valid') {
    return NextResponse.json(
      { error: `Ticket is ${ticket.status}` },
      { status: 409 },
    );
  }

  // Fetch profile and tier in parallel
  const [profileRes, tierRes] = await Promise.all([
    ticket.holder_id
      ? supabase
          .from('profiles')
          .select('display_name, handle')
          .eq('id', ticket.holder_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('ticket_tiers')
      .select('display_name, name')
      .eq('id', ticket.tier_id)
      .single(),
  ]);

  // Mark as checked in
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('tickets')
    .update({ checked_in_at: now, used_at: now, status: 'used' })
    .eq('id', ticket.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Determine holder name: prefer profile, fall back to metadata
  const profile = profileRes.data as ProfileShape | null;
  const tier = tierRes.data as TierShape | null;
  const meta = ticket.metadata as Record<string, Json> | null;
  const metaName = meta
    ? `${String(meta['first_name'] ?? '')} ${String(meta['last_name'] ?? '')}`.trim()
    : '';
  const holderName = profile?.display_name ?? (metaName || 'Guest');

  return NextResponse.json({
    ok: true,
    holder: { display_name: holderName, handle: profile?.handle ?? null },
    tier,
    code: ticket.code,
  });
}
