import { type NextRequest, NextResponse } from 'next/server';
import { sendOrderReceiptEmail } from '../../../../lib/receipt/sendOrderReceiptEmail';

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

  const body = (await request.json()) as { orderId?: string; logId?: string };
  const orderId = body.orderId?.trim();
  const logId = body.logId?.trim();

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  try {
    await sendOrderReceiptEmail({ orderId, existingLogId: logId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
