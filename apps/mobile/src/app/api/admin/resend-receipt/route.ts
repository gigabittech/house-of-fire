import { type NextRequest, NextResponse } from 'next/server';
import {
  ReceiptResendRateLimitError,
  resendOrderReceipt,
  type ReceiptResendSource,
} from '../../../../lib/receipt/emailResend.server';
import { createServiceRoleClient } from '../../../../lib/supabase.server';

function isAuthorized(request: NextRequest): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${serviceKey}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    orderId?: string;
    logId?: string;
    actorId?: string;
    source?: ReceiptResendSource;
  };
  const orderId = body.orderId?.trim();
  const logId = body.logId?.trim();
  const actorId = body.actorId?.trim() || null;
  const source = body.source ?? (logId ? 'admin_email_log_retry' : 'admin_guests');

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();
  const actorKey = actorId ?? 'service';

  try {
    const { recipient } = await resendOrderReceipt({
      supabase,
      orderId,
      actorType: actorId ? 'admin' : 'system',
      actorId,
      actorKey,
      source,
      existingLogId: logId,
    });
    return NextResponse.json({ ok: true, recipient });
  } catch (err) {
    if (err instanceof ReceiptResendRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
