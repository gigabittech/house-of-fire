import { type NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../../../lib/supabase.admin';
import { validateDiscountCodeForCheckout } from '../../../../../lib/promoCodes';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    code?: string;
    tierId?: string;
    subtotalCents?: number;
  };

  const rawCode = body.code?.trim();
  if (!rawCode || !body.tierId) {
    return NextResponse.json({ valid: false, error: 'code and tierId required' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const result = await validateDiscountCodeForCheckout(supabase, {
    rawCode,
    tierId: body.tierId,
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
    discountCents: result.discountCents,
    label: result.label,
  });
}
