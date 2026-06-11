import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { performDoorCheckIn } from '@hof/door-checkin/server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

interface ScanRequestBody {
  code: string;
  client_scan_id?: string;
  scanned_at?: string;
  event_id?: string;
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
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isScanBody(body)) {
    return NextResponse.json({ error: 'Missing required field: code' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const result = await performDoorCheckIn(supabase, {
    code: body.code,
    client_scan_id: body.client_scan_id,
    scanned_at: body.scanned_at,
    event_id: body.event_id,
  });

  return NextResponse.json(result.body, { status: result.status });
}
