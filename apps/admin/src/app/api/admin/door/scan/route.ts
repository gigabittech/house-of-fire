import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

interface ScanRequestBody {
  code: string;
}

function isScanBody(v: unknown): v is ScanRequestBody {
  return (
    typeof v === 'object' &&
    v !== null &&
    'code' in v &&
    typeof (v as Record<string, unknown>)['code'] === 'string'
  );
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

  // QR data may be JSON: {"code":"HOF-24-0001","event":"...","v":1}
  // Try to parse; fall back to using the raw string as the code.
  let lookupCode = rawCode;
  try {
    const parsed = JSON.parse(rawCode) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'code' in parsed &&
      typeof (parsed as Record<string, unknown>)['code'] === 'string'
    ) {
      lookupCode = (parsed as Record<string, string>)['code'] ?? rawCode;
    }
  } catch {
    // Not JSON — use as-is
  }

  // Look up ticket by code column first; fall back to qr_data exact match
  const { data: ticket, error: lookupError } = await supabase
    .from('tickets')
    .select('id, code, status, used_at, holder_id, tier_id, event_id')
    .or(`code.eq.${lookupCode},qr_data.eq.${rawCode}`)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (ticket === null) {
    return NextResponse.json({ error: 'Ticket not found', outcome: 'not_found' }, { status: 404 });
  }

  if (ticket.status === 'used' || ticket.used_at) {
    return NextResponse.json(
      {
        error: 'Ticket already used',
        outcome: 'already_used',
        used_at: ticket.used_at,
      },
      { status: 409 },
    );
  }

  if (ticket.status !== 'valid') {
    return NextResponse.json(
      {
        error: `Ticket status is ${ticket.status}`,
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
    return NextResponse.json(
      { error: 'Ticket already used', outcome: 'already_used' },
      { status: 409 },
    );
  }

  return NextResponse.json({
    outcome: 'admitted',
    ticket_id: ticket.id,
    code: ticket.code,
    used_at: usedAt,
  });
}
