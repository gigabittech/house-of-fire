import { NextResponse } from 'next/server';
import type { Database } from '../../../../lib/database.types';
import { getActiveEvent, NO_EVENTS_MESSAGE } from '../../../../lib/liveEvent.server';
import { getUserEventTicketCount } from '../../../../lib/ticketInventory';
import { effectiveMaxTicketsPerUser } from '../../../../lib/ticketLimits';
import { resolveEventDisplayStatus } from '../../../../lib/eventDisplay';
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from '../../../../lib/supabase.server';

type TicketTierRow = Database['public']['Tables']['ticket_tiers']['Row'];

function normalizeDbTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function effectiveTierStatus(tier: TicketTierRow, remaining: number): TicketTierRow['status'] {
  if (tier.status === 'hidden') return 'hidden';
  if (tier.status === 'sold_out' || remaining <= 0) return 'sold_out';
  return 'available';
}

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: event, error } = await getActiveEvent(supabase);

  if (error || !event) {
    return NextResponse.json({ error: NO_EVENTS_MESSAGE }, { status: 404 });
  }

  const { data: tiers } = await supabase
    .from('ticket_tiers')
    .select('*')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true });

  const inventorySupabase = await createServiceRoleClient();

  const soldByTier: Record<string, number> = {};
  const tiersHaveSoldCount = (tiers ?? []).some(
    (t) => typeof (t as TicketTierRow & { sold_count?: number }).sold_count === 'number',
  );

  if (tiersHaveSoldCount) {
    for (const tier of tiers ?? []) {
      const sc = (tier as TicketTierRow & { sold_count?: number }).sold_count;
      if (typeof sc === 'number') soldByTier[tier.id] = sc;
    }
  } else {
    const { data: tickets } = await inventorySupabase
      .from('tickets')
      .select('tier_id')
      .eq('event_id', event.id)
      .in('status', ['valid', 'used']);

    for (const t of tickets ?? []) {
      soldByTier[t.tier_id] = (soldByTier[t.tier_id] ?? 0) + 1;
    }
  }

  const tiersWithRemaining = (tiers ?? []).map((tier) => {
    const sold = soldByTier[tier.id] ?? 0;
    const remaining = Math.max(0, tier.capacity - sold);
    const feeCents = (tier as TicketTierRow & { fee_cents?: number }).fee_cents ?? 0;
    return {
      ...tier,
      fee_cents: feeCents,
      sold,
      remaining,
      effective_status: effectiveTierStatus(tier, remaining),
    };
  });

  const faqs = (event as { faqs?: unknown }).faqs ?? [];
  const maxTicketsPerUser = effectiveMaxTicketsPerUser(
    (event as { max_tickets_per_user?: number }).max_tickets_per_user,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userTicketCount = 0;
  let userTicketsRemaining = maxTicketsPerUser;

  if (user) {
    const userCount = await getUserEventTicketCount(inventorySupabase, user.id, event.id);
    if (!('error' in userCount)) {
      userTicketCount = userCount.count;
      userTicketsRemaining = Math.max(0, maxTicketsPerUser - userTicketCount);
    }
  }

  const visibility = (event as { visibility?: 'public' | 'hidden' }).visibility ?? 'public';
  const dressCode = (event as { dress_code?: string | null }).dress_code ?? null;
  const displayStatus = resolveEventDisplayStatus(
    { status: event.status, visibility },
    tiersWithRemaining,
  );

  return NextResponse.json({
    event: {
      ...event,
      visibility,
      dress_code: dressCode,
      display_status: displayStatus,
      doors_open: normalizeDbTime(event.doors_open),
      doors_close: normalizeDbTime(event.doors_close),
      faqs,
      max_tickets_per_user: maxTicketsPerUser,
      user_ticket_count: userTicketCount,
      user_tickets_remaining: userTicketsRemaining,
      ticket_tiers: tiersWithRemaining as TicketTierRow[],
    },
  });
}
