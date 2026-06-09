import { NextResponse } from 'next/server';
import { daysSince } from '@/lib/formatters';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const supabase = createAdminSupabaseClient();

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, handle, display_name, member_since, role, settings, avatar_url')
    .order('member_since', { ascending: false });

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select(
      'holder_id, event_id, tier_id, purchased_at, events(edition_number), ticket_tiers(display_name, name)',
    )
    .in('status', ['valid', 'used', 'transferred']);

  if (ticketsError) {
    return NextResponse.json({ error: ticketsError.message }, { status: 500 });
  }

  const { data: posts, error: postsError } = await supabase.from('posts').select('author_id');

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  const ticketCountByHolder = new Map<string, number>();
  const lastEditionByHolder = new Map<string, number>();
  const latestTierByHolder = new Map<string, string>();
  const latestPurchaseByHolder = new Map<string, string>();

  for (const t of tickets ?? []) {
    const hid = t.holder_id;
    if (!hid) continue;
    ticketCountByHolder.set(hid, (ticketCountByHolder.get(hid) ?? 0) + 1);
    const ev = Array.isArray(t.events) ? t.events[0] : t.events;
    const edition =
      ev && typeof ev === 'object' && 'edition_number' in ev
        ? (ev as { edition_number: number }).edition_number
        : null;
    if (edition != null) {
      const prev = lastEditionByHolder.get(hid) ?? 0;
      if (edition > prev) lastEditionByHolder.set(hid, edition);
    }
    const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
    const tierName =
      tier && typeof tier === 'object'
        ? ((tier as { display_name?: string; name?: string }).display_name ??
          (tier as { name?: string }).name ??
          'GA')
        : 'GA';
    const purchased = t.purchased_at;
    const prevPurchase = latestPurchaseByHolder.get(hid);
    if (!prevPurchase || purchased > prevPurchase) {
      latestPurchaseByHolder.set(hid, purchased);
      latestTierByHolder.set(hid, tierName);
    }
  }

  const postCountByAuthor = new Map<string, number>();
  for (const p of posts ?? []) {
    postCountByAuthor.set(p.author_id, (postCountByAuthor.get(p.author_id) ?? 0) + 1);
  }

  const members = (profiles ?? []).map((p) => ({
    id: p.id,
    handle: p.handle,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    member_since: p.member_since,
    role: p.role,
    settings: (p.settings as Record<string, unknown> | null) ?? null,
    ticket_count: ticketCountByHolder.get(p.id) ?? 0,
    post_count: postCountByAuthor.get(p.id) ?? 0,
    last_edition: lastEditionByHolder.get(p.id) ?? null,
    latest_tier_name: latestTierByHolder.get(p.id) ?? null,
  }));

  const total = members.length;
  const newThisMonth = members.filter((m) => daysSince(m.member_since) <= 30).length;
  const crewCount = members.filter((m) => m.role === 'crew' || m.role === 'admin').length;
  const photographerCount = members.filter((m) => m.settings?.['photographer'] === true).length;
  const withTickets = members.filter((m) => m.ticket_count > 0).length;
  const returning = members.filter((m) => m.ticket_count >= 2).length;
  const returnRate = withTickets > 0 ? Math.round((returning / withTickets) * 100) : 0;
  const active90 = members.filter((m) => {
    const purchase = latestPurchaseByHolder.get(m.id);
    if (purchase && daysSince(purchase) <= 90) return true;
    return daysSince(m.member_since) <= 90;
  }).length;

  return NextResponse.json({
    members,
    stats: {
      total,
      newThisMonth,
      crewCount,
      photographerCount,
      returnRate,
      active90,
    },
  });
}
