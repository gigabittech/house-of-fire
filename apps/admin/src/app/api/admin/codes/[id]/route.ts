import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../../../lib/supabase.admin';
import {
  fetchPromoAnalyticsForCodes,
  syncAllDiscountCodeUses,
} from '../../../../../lib/promoCodes';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminSupabaseClient();
  await syncAllDiscountCodeUses(supabase);

  const { data, error } = await supabase.from('discount_codes').select('*').eq('id', id).single();
  if (error || !data) {
    return NextResponse.json({ error: 'Code not found' }, { status: 404 });
  }

  const analyticsMap = await fetchPromoAnalyticsForCodes(supabase, [id]);
  const stats = analyticsMap[id];
  const totalUses = stats?.totalUses ?? data.uses ?? 0;

  return NextResponse.json({
    code: {
      ...data,
      uses: totalUses,
      analytics: {
        totalUses,
        remainingUses: data.max_uses !== null ? Math.max(0, data.max_uses - totalUses) : null,
        totalDiscountCents: stats?.totalDiscountCents ?? 0,
        revenueCents: stats?.revenueCents ?? 0,
        lastUsedAt: stats?.lastUsedAt ?? null,
      },
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from('discount_codes').update({ active: false }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
