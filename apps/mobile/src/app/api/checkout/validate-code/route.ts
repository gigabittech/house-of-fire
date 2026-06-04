import { type NextRequest, NextResponse } from 'next/server';
import { rateLimitCheck } from '../../../../lib/rateLimit';
import { validateDiscountCodeForCheckout } from '../../../../lib/promoCodes';
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from '../../../../lib/supabase.server';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const allowed = rateLimitCheck('validate-code:' + ip, 20, 60_000);
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as {
    code?: string;
    tierId?: string;
    subtotalCents?: number;
  };
  const rawCode = body.code?.trim().toUpperCase();
  if (!rawCode) {
    return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 });
  }

  const inventorySupabase = await createServiceRoleClient();
  const result = await validateDiscountCodeForCheckout(inventorySupabase, {
    rawCode,
    tierId: body.tierId ?? '',
    subtotalCents: body.subtotalCents ?? 0,
  });

  if (!result.ok) {
    return NextResponse.json({ valid: false, error: result.error });
  }

  const dc = result.code;
  return NextResponse.json({
    valid: true,
    code: dc.code,
    codeId: dc.id,
    kind: dc.kind,
    value: dc.value,
    discountCents: result.discountCents,
    label: result.label,
  });
}
