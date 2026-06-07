import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Json } from '@/lib/database.types';
import { verifyTicketQRData } from '@/lib/qr';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

interface ScanRequestBody {
  code: string;
}

type ProfileShape = { display_name: string; handle: string | null };
type TierShape = { display_name: string; name: string };

function isScanBody(v: unknown): v is ScanRequestBody {
  return (
    typeof v === 'object' &&
    v !== null &&
    'code' in v &&
    typeof (v as Record<string, unknown>)['code'] === 'string'
  );
}

function holderNameFrom(
  profile: ProfileShape | null,
  meta: Record<string, Json> | null,
): string {
  const metaName = meta
    ? `${String(meta['first_name'] ?? '')} ${String(meta['last_name'] ?? '')}`.trim()
    : '';
  return profile?.display_name ?? (metaName || 'Guest');
}

async function fetchAttendee(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  ticket: {
    holder_id: string | null;
    tier_id: string;
    metadata: Json | null;
  },
) {
  const [profileRes, tierRes] = await Promise.all([
    ticket.holder_id
      ? supabase.from('profiles').select('display_name, handle').eq('id', ticket.holder_id).single()
      : Promise.resolve({ data: null, error: null }),
    supabase.from('ticket_tiers').select('display_name, name').eq('id', ticket.tier_id).single(),
  ]);

  const profile = profileRes.data as ProfileShape | null;
  const tier = tierRes.data as TierShape | null;
  const meta = ticket.metadata as Record<string, Json> | null;

  return {
    holder: { display_name: holderNameFrom(profile, meta), handle: profile?.handle ?? null },
    tier,
  };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isScanBody(body)) {
    return NextResponse.json({ error: 'Missing required field: code' }, { status: 400 });
  }

  const { code: rawCode } = body;
  const supabase = createAdminSupabaseClient();

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
        return NextResponse.json(
          { error: 'Invalid QR signature', outcome: 'invalid_qr' },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json({ error: 'Invalid QR data', outcome: 'invalid_qr' }, { status: 400 });
    }
  }

  const codeUpper = lookupCode.toUpperCase();

  const { data: ticket, error: lookupError } = await supabase
    .from('tickets')
    .select('id, code, status, used_at, checked_in_at, holder_id, tier_id, event_id, metadata')
    .or(`code.eq.${codeUpper},qr_data.eq.${rawCode}`)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (ticket === null) {
    return NextResponse.json({ error: 'Ticket not found', outcome: 'not_found' }, { status: 404 });
  }

  if (ticket.status === 'used' || ticket.used_at || ticket.checked_in_at) {
    const attendee = await fetchAttendee(supabase, ticket);
    return NextResponse.json(
      {
        error: 'Already checked in',
        outcome: 'already_used',
        checkedInAt: ticket.checked_in_at ?? ticket.used_at,
        holder: attendee.holder,
        tier: attendee.tier,
        code: ticket.code,
      },
      { status: 409 },
    );
  }

  if (ticket.status !== 'valid') {
    return NextResponse.json(
      {
        error: `Ticket is ${ticket.status}`,
        outcome: 'invalid_status',
      },
      { status: 409 },
    );
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
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated) {
    const attendee = await fetchAttendee(supabase, ticket);
    return NextResponse.json(
      {
        error: 'Already checked in',
        outcome: 'already_used',
        holder: attendee.holder,
        tier: attendee.tier,
        code: ticket.code,
      },
      { status: 409 },
    );
  }

  const attendee = await fetchAttendee(supabase, ticket);

  return NextResponse.json({
    outcome: 'admitted',
    ok: true,
    ticket_id: ticket.id,
    code: ticket.code,
    used_at: usedAt,
    checkedInAt: usedAt,
    holder: attendee.holder,
    tier: attendee.tier,
  });
}
