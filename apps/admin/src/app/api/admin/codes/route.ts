import { type NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../../lib/supabase.admin';
import { fetchPromoAnalyticsForCodes, syncAllDiscountCodeUses } from '../../../../lib/promoCodes';
import { requireAdminRole } from '../../../../lib/requireAdminRole';

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const supabase = createAdminSupabaseClient();
  await syncAllDiscountCodeUses(supabase);

  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const codes = data ?? [];
  const analytics = await fetchPromoAnalyticsForCodes(
    supabase,
    codes.map((c) => c.id),
  );

  const codesWithStats = codes.map((c) => {
    const stats = analytics[c.id];
    const totalUses = stats?.totalUses ?? c.uses ?? 0;
    const remainingUses = c.max_uses !== null ? Math.max(0, c.max_uses - totalUses) : null;
    return {
      ...c,
      uses: totalUses,
      analytics: {
        totalUses,
        remainingUses,
        totalDiscountCents: stats?.totalDiscountCents ?? 0,
        revenueCents: stats?.revenueCents ?? 0,
        lastUsedAt: stats?.lastUsedAt ?? null,
      },
    };
  });

  const pools = ['crew', 'press', 'goodwill'] as const;
  const poolStats = pools.map((pool) => {
    const poolCodes = codesWithStats.filter((c) => c.pool === pool);
    const used = poolCodes.reduce((s, c) => s + (c.analytics.totalUses ?? 0), 0);
    const cap = poolCodes.reduce((s, c) => s + (c.max_uses ?? 0), 0);
    return { pool, used, cap, count: poolCodes.length };
  });

  return NextResponse.json({ codes: codesWithStats, poolStats });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const supabase = createAdminSupabaseClient();
  const body = (await request.json()) as {
    code: string;
    kind: string;
    value: number;
    max_uses?: number | null;
    event_id?: string | null;
    expires_at?: string | null;
    note?: string | null;
    pool?: string | null;
  };

  const code = body.code?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 });

  const kind =
    body.kind === 'flat_cents' ? 'flat_cents' : body.kind === 'fixed' ? 'fixed' : 'percent';

  const { data, error } = await supabase
    .from('discount_codes')
    .insert({
      code,
      kind,
      value: body.value,
      max_uses: body.max_uses ?? null,
      event_id: body.event_id ?? null,
      expires_at: body.expires_at ?? null,
      note: body.note ?? null,
      pool:
        body.pool === 'crew' || body.pool === 'press' || body.pool === 'goodwill'
          ? body.pool
          : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code: data }, { status: 201 });
}
