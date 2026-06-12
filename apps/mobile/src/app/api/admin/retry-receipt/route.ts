import { type NextRequest, NextResponse } from 'next/server';

function isAuthorized(request: NextRequest): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${serviceKey}`;
}

/** @deprecated Use POST /api/admin/resend-receipt */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { orderId?: string; logId?: string; actorId?: string };
  const url = new URL(request.url);
  const res = await fetch(`${url.origin}/api/admin/resend-receipt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.get('authorization') ?? '',
    },
    body: JSON.stringify({
      orderId: body.orderId,
      logId: body.logId,
      actorId: body.actorId,
      source: body.logId ? 'admin_email_log_retry' : 'service_retry',
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
  return NextResponse.json(data, { status: res.status });
}
