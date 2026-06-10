import { type NextRequest, NextResponse } from 'next/server';
import {
  assertMemberOwnsOrder,
  ReceiptResendForbiddenError,
  ReceiptResendNotFoundError,
  ReceiptResendRateLimitError,
  resendOrderReceipt,
} from '../../../../../lib/receipt/emailResend.server';
import { createServerSupabaseClient, createServiceRoleClient } from '../../../../../lib/supabase.server';

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await ctx.params;
  const trimmed = orderId?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in to resend your receipt.' }, { status: 401 });
  }

  const service = await createServiceRoleClient();

  try {
    await assertMemberOwnsOrder(service, user.id, trimmed);
    const { recipient } = await resendOrderReceipt({
      supabase: service,
      orderId: trimmed,
      actorType: 'member',
      actorId: user.id,
      actorKey: clientIp(request),
      source: 'member_tickets',
    });
    return NextResponse.json({ ok: true, recipient });
  } catch (err) {
    if (err instanceof ReceiptResendRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof ReceiptResendForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof ReceiptResendNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
