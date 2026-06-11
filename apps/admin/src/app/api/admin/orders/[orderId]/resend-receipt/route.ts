import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/requireAdminRole';

export async function POST(_request: NextRequest, ctx: { params: Promise<{ orderId: string }> }) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { orderId } = await ctx.params;
  const trimmed = orderId?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const mobileUrl =
    process.env.MOBILE_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' },
      { status: 500 },
    );
  }

  const res = await fetch(`${mobileUrl}/api/admin/resend-receipt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      orderId: trimmed,
      actorId: auth.userId,
      source: 'admin_guests',
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    ok?: boolean;
    recipient?: string;
  };
  return NextResponse.json(data, { status: res.status });
}
