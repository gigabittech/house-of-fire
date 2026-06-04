import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getActiveEvent, NO_EVENTS_MESSAGE } from '@/lib/liveEvent.server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

function guestName(
  profile: { display_name?: string | null } | null,
  metadata: Record<string, unknown> | null,
  code: string,
): string {
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  const first = typeof metadata?.first_name === 'string' ? metadata.first_name.trim() : '';
  const last = typeof metadata?.last_name === 'string' ? metadata.last_name.trim() : '';
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return code;
}

export async function GET(request: NextRequest) {
  const eventIdParam = request.nextUrl.searchParams.get('eventId');
  const limitRaw = request.nextUrl.searchParams.get('limit');
  const limit = Math.min(50, Math.max(1, parseInt(limitRaw ?? '30', 10) || 30));

  const supabase = createAdminSupabaseClient();

  let eventId = eventIdParam;
  if (!eventId) {
    const { data: active } = await getActiveEvent(supabase, 'id');
    if (!active) {
      return NextResponse.json({ error: NO_EVENTS_MESSAGE }, { status: 404 });
    }
    eventId = active.id;
  }

  const { data: rows, error } = await supabase
    .from('tickets')
    .select(
      `
      id,
      code,
      status,
      purchased_at,
      used_at,
      checked_in_at,
      source,
      stripe_charge_id,
      metadata,
      profiles ( display_name ),
      ticket_tiers ( display_name, name )
    `,
    )
    .eq('event_id', eventId)
    .in('status', ['valid', 'used'])
    .order('purchased_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const activity = (rows ?? []).map((row) => {
    const profileRaw = row.profiles as { display_name?: string | null } | null | Array<{
      display_name?: string | null;
    }>;
    const profile = Array.isArray(profileRaw) ? (profileRaw[0] ?? null) : profileRaw;
    const tierRaw = row.ticket_tiers as
      | { display_name?: string; name?: string }
      | Array<{ display_name?: string; name?: string }>
      | null;
    const tier = Array.isArray(tierRaw) ? (tierRaw[0] ?? null) : tierRaw;
    const tierLabel = tier?.display_name ?? tier?.name ?? 'Ticket';
    const meta =
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : null;
    const isDoor =
      row.source === 'door' || (row.stripe_charge_id ?? '').startsWith('door-');
    const isCheckedIn = row.status === 'used' || !!row.checked_in_at;
    const payMethod =
      typeof meta?.pay_method === 'string' ? meta.pay_method : null;

    const purchased = new Date(row.purchased_at);
    const t = purchased.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (isCheckedIn) {
      return {
        t,
        name: guestName(profile, meta, row.code),
        meta: `${tierLabel} · checked in`,
        tone: 'success' as const,
        kind: 'scan' as const,
      };
    }

    if (isDoor) {
      const payLabel =
        payMethod === 'tap'
          ? 'Tap'
          : payMethod === 'card'
            ? 'Card'
            : payMethod === 'cash'
              ? 'Cash'
              : 'Door';
      return {
        t,
        name: `Walk-up · ${guestName(profile, meta, row.code)}`,
        meta: `${tierLabel} · ${payLabel}`,
        tone: 'amber' as const,
        kind: 'sale' as const,
      };
    }

    return {
      t,
      name: guestName(profile, meta, row.code),
      meta: `${tierLabel} · online`,
      tone: 'neutral' as const,
      kind: 'system' as const,
    };
  });

  return NextResponse.json({ activity });
}
