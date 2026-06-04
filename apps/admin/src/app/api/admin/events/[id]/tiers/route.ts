import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { parseTierRows, tierRowToDbInsert } from '@/lib/tierPayload';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

const ACTIVE_TICKET = ['valid', 'used'] as const;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await context.params;
  const supabase = createAdminSupabaseClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const { data: tiers, error: tiersError } = await supabase
    .from('ticket_tiers')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  if (tiersError) {
    return NextResponse.json({ error: tiersError.message }, { status: 500 });
  }

  const { data: tickets } = await supabase
    .from('tickets')
    .select('tier_id')
    .eq('event_id', eventId)
    .in('status', [...ACTIVE_TICKET]);

  const soldByTier: Record<string, number> = {};
  for (const t of tickets ?? []) {
    soldByTier[t.tier_id] = (soldByTier[t.tier_id] ?? 0) + 1;
  }

  const withStats = (tiers ?? []).map((tier) => {
    const sold = soldByTier[tier.id] ?? 0;
    return {
      ...tier,
      sold,
      remaining: Math.max(0, tier.capacity - sold),
    };
  });

  return NextResponse.json({ tiers: withStats });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { id: eventId } = await context.params;
  const body = (await request.json()) as { tiers?: unknown };
  const parsed = parseTierRows(body.tiers ?? []);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const { data: existingTiers } = await supabase
    .from('ticket_tiers')
    .select('id')
    .eq('event_id', eventId);

  const existingIds = new Set((existingTiers ?? []).map((t) => t.id));
  const payloadIds = new Set(parsed.tiers.filter((t) => t.id).map((t) => t.id as string));

  for (const removedId of existingIds) {
    if (payloadIds.has(removedId)) continue;

    const { count } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('tier_id', removedId)
      .in('status', [...ACTIVE_TICKET]);

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot remove a tier that already has ticket sales' },
        { status: 409 },
      );
    }

    const { error: delErr } = await supabase.from('ticket_tiers').delete().eq('id', removedId);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
  }

  for (const tier of parsed.tiers) {
    const row = tierRowToDbInsert(eventId, tier);

    if (tier.id && existingIds.has(tier.id)) {
      const { error } = await supabase.from('ticket_tiers').update(row).eq('id', tier.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from('ticket_tiers').insert(row);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  const { data: tiers } = await supabase
    .from('ticket_tiers')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  return NextResponse.json({ tiers: tiers ?? [] });
}
