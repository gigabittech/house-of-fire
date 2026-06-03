import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get('eventId');
  if (!eventId) {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('purchased_at, amount_cents, tier_id, ticket_tiers(display_name, name, capacity)')
    .eq('event_id', eventId)
    .in('status', ['valid', 'used'])
    .order('purchased_at', { ascending: true });

  if (ticketsError) {
    return NextResponse.json({ error: ticketsError.message }, { status: 500 });
  }

  const { data: tiers, error: tiersError } = await supabase
    .from('ticket_tiers')
    .select('id, display_name, name, capacity')
    .eq('event_id', eventId);

  if (tiersError) {
    return NextResponse.json({ error: tiersError.message }, { status: 500 });
  }

  const byDay = new Map<string, number>();
  for (const t of tickets ?? []) {
    const day = t.purchased_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  const salesByDay = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, count]) => count);

  const salesData =
    salesByDay.length >= 14 ? salesByDay.slice(-14) : salesByDay.length > 0 ? salesByDay : [0];

  const tierSold = new Map<string, number>();
  for (const t of tickets ?? []) {
    tierSold.set(t.tier_id, (tierSold.get(t.tier_id) ?? 0) + 1);
  }

  const tierBars = (tiers ?? []).map((tier) => ({
    label: tier.display_name ?? tier.name,
    sold: tierSold.get(tier.id) ?? 0,
    cap: tier.capacity,
  }));

  const { count: openRequests } = await supabase
    .from('refund_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return NextResponse.json({
    salesData,
    tierBars,
    openRequests: openRequests ?? 0,
  });
}
