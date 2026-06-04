import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type Supabase = SupabaseClient<Database>;
export type DiscountCodeRow = Database['public']['Tables']['discount_codes']['Row'];

export type PromoValidationResult =
  | {
      ok: true;
      code: DiscountCodeRow;
      discountCents: number;
      label: string;
    }
  | { ok: false; error: string };

export function normalizeDiscountKind(kind: string): 'percent' | 'flat' {
  if (kind === 'percent') return 'percent';
  return 'flat';
}

export function computeDiscountCents(
  code: Pick<DiscountCodeRow, 'kind' | 'value'>,
  subtotalCents: number,
): number {
  const subtotal = Math.max(0, subtotalCents);
  if (normalizeDiscountKind(code.kind) === 'percent') {
    return Math.round(subtotal * (Number(code.value) / 100));
  }
  return Math.min(Math.round(Number(code.value)), subtotal);
}

export function promoLabel(code: Pick<DiscountCodeRow, 'kind' | 'value' | 'code'>): string {
  if (normalizeDiscountKind(code.kind) === 'percent') {
    return `${code.value}% off`;
  }
  return `$${(Number(code.value) / 100).toFixed(2)} off`;
}

export async function fetchDiscountCodeById(
  supabase: Supabase,
  codeId: string,
): Promise<DiscountCodeRow | null> {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('id', codeId)
    .eq('active', true)
    .maybeSingle();
  if (error || !data) return null;
  return data as DiscountCodeRow;
}

export async function fetchDiscountCodeByText(
  supabase: Supabase,
  rawCode: string,
): Promise<DiscountCodeRow | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();
  if (error || !data) return null;
  return data as DiscountCodeRow;
}

export async function validateDiscountCodeForCheckout(
  supabase: Supabase,
  params: {
    tierId: string;
    subtotalCents: number;
    codeId?: string | null;
    rawCode?: string | null;
  },
): Promise<PromoValidationResult> {
  let dc: DiscountCodeRow | null = null;
  if (params.codeId) {
    dc = await fetchDiscountCodeById(supabase, params.codeId);
  } else if (params.rawCode) {
    dc = await fetchDiscountCodeByText(supabase, params.rawCode);
  }

  if (!dc) {
    return { ok: false, error: 'Code not found' };
  }

  if (dc.expires_at && new Date(dc.expires_at) < new Date()) {
    return { ok: false, error: 'Code has expired' };
  }

  if (dc.max_uses !== null && dc.uses >= dc.max_uses) {
    return { ok: false, error: 'Code has reached its usage limit' };
  }

  if (dc.event_id && params.tierId) {
    const { data: tier } = await supabase
      .from('ticket_tiers')
      .select('event_id')
      .eq('id', params.tierId)
      .single();
    if (tier && tier.event_id !== dc.event_id) {
      return { ok: false, error: 'Code not valid for this event' };
    }
  }

  const discountCents = computeDiscountCents(dc, params.subtotalCents);
  return {
    ok: true,
    code: dc,
    discountCents,
    label: promoLabel(dc),
  };
}

export async function syncAllDiscountCodeUses(supabase: Supabase): Promise<void> {
  const { error } = await supabase.rpc('sync_discount_code_uses');
  if (error) {
    console.error('[promo] sync_discount_code_uses failed:', error.message);
  }
}

export type PromoCodeAnalytics = {
  totalUses: number;
  remainingUses: number | null;
  totalDiscountCents: number;
  revenueCents: number;
  lastUsedAt: string | null;
};

export async function fetchPromoAnalyticsForCodes(
  supabase: Supabase,
  codeIds: string[],
): Promise<Record<string, PromoCodeAnalytics>> {
  const out: Record<string, PromoCodeAnalytics> = {};
  if (codeIds.length === 0) return out;

  const { data: orders, error } = await supabase
    .from('orders')
    .select('discount_code_id, discount_cents, total_cents, created_at, status')
    .in('discount_code_id', codeIds)
    .eq('status', 'completed');

  if (error) {
    console.error('[promo] analytics query failed:', error.message);
    return out;
  }

  for (const id of codeIds) {
    out[id] = {
      totalUses: 0,
      remainingUses: null,
      totalDiscountCents: 0,
      revenueCents: 0,
      lastUsedAt: null,
    };
  }

  for (const row of orders ?? []) {
    const id = row.discount_code_id;
    if (!id || !out[id]) continue;
    const a = out[id];
    a.totalUses += 1;
    a.totalDiscountCents += row.discount_cents ?? 0;
    a.revenueCents += row.total_cents ?? 0;
    if (!a.lastUsedAt || row.created_at > a.lastUsedAt) {
      a.lastUsedAt = row.created_at;
    }
  }

  return out;
}

/** When every ticket on an order is refunded/cancelled, mark the order and release promo use. */
export async function maybeReleasePromoForOrder(
  supabase: Supabase,
  orderId: string,
): Promise<void> {
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, discount_code_id')
    .eq('id', orderId)
    .maybeSingle();

  if (!order?.discount_code_id || order.status !== 'completed') return;

  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId)
    .not('status', 'in', '("refunded","cancelled")');

  if ((count ?? 0) > 0) return;

  const { error } = await supabase
    .from('orders')
    .update({ status: 'refunded' })
    .eq('id', orderId)
    .eq('status', 'completed');

  if (error) {
    console.error('[promo] order refund status update failed:', error.message);
  }
}
