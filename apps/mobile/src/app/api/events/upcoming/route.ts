import { NextResponse } from 'next/server';
import type { Database } from '../../../../lib/database.types';
import { createServerSupabaseClient } from '../../../../lib/supabase.server';

type TicketTierRow = Database['public']['Tables']['ticket_tiers']['Row'];

function normalizeDbTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .in('status', ['upcoming', 'live'])
    .order('edition_number', { ascending: false })
    .limit(1)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: 'No upcoming event found' }, { status: 404 });
  }

  const { data: tiers } = await supabase
    .from('ticket_tiers')
    .select('*')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true });

  const { data: tickets } = await supabase
    .from('tickets')
    .select('tier_id')
    .eq('event_id', event.id)
    .in('status', ['valid', 'used']);

  const soldByTier: Record<string, number> = {};
  for (const t of tickets ?? []) {
    soldByTier[t.tier_id] = (soldByTier[t.tier_id] ?? 0) + 1;
  }

  const tiersWithRemaining = (tiers ?? []).map((tier) => {
    const sold = soldByTier[tier.id] ?? 0;
    return {
      ...tier,
      sold,
      remaining: Math.max(0, tier.capacity - sold),
    };
  });

  const faqs = (event as { faqs?: unknown }).faqs ?? [];

  return NextResponse.json({
    event: {
      ...event,
      doors_open: normalizeDbTime(event.doors_open),
      doors_close: normalizeDbTime(event.doors_close),
      faqs,
      ticket_tiers: tiersWithRemaining as TicketTierRow[],
    },
  });
}
