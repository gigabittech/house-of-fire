import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../../lib/database.types';
import { rateLimitCheck } from '../../../../lib/rateLimit';
import { createServerSupabaseClient } from '../../../../lib/supabase.server';

type DiscountCodeRow = Database['public']['Tables']['discount_codes']['Row'];

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const allowed = rateLimitCheck('validate-code:' + ip, 20, 60_000); // 20 per minute
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
  if (!rawCode)
    return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 });

  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', rawCode)
    .eq('active', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false, error: 'Code not found' });
  }

  const dc = data as DiscountCodeRow;

  // Check expiry
  if (dc.expires_at && new Date(dc.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Code has expired' });
  }

  // Check max uses
  if (dc.max_uses !== null && dc.uses >= dc.max_uses) {
    return NextResponse.json({ valid: false, error: 'Code has reached its usage limit' });
  }

  // Check event restriction
  if (dc.event_id && body.tierId) {
    // Look up which event this tier belongs to
    const { data: tier } = await supabase
      .from('ticket_tiers')
      .select('event_id')
      .eq('id', body.tierId)
      .single();
    if (tier && tier.event_id !== dc.event_id) {
      return NextResponse.json({ valid: false, error: 'Code not valid for this event' });
    }
  }

  // Compute discount amount on the subtotal
  const subtotal = body.subtotalCents ?? 0;
  let discountCents = 0;
  if (dc.kind === 'percent') {
    discountCents = Math.round(subtotal * (dc.value / 100));
  } else {
    // flat_cents
    discountCents = Math.min(Math.round(dc.value), subtotal);
  }

  return NextResponse.json({
    valid: true,
    code: dc.code,
    codeId: dc.id,
    kind: dc.kind,
    value: dc.value,
    discountCents,
    label: dc.kind === 'percent' ? `${dc.value}% off` : `$${(dc.value / 100).toFixed(2)} off`,
  });
}
