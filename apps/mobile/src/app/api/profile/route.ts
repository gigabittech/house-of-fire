import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../lib/supabase.server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [profileRes, ticketsRes, reactionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('tickets')
      .select('*, events(*), ticket_tiers(*)')
      .eq('holder_id', user.id)
      .order('purchased_at', { ascending: false }),
    supabase.rpc('profile_author_reaction_totals', { p_author_id: user.id }),
  ]);

  if (profileRes.error) {
    return NextResponse.json({ error: profileRes.error.message }, { status: 500 });
  }
  if (reactionsRes.error) {
    return NextResponse.json({ error: reactionsRes.error.message }, { status: 500 });
  }

  const profileRow = profileRes.data;
  const tickets = ticketsRes.data ?? [];
  const reactionTotals = (reactionsRes.data ?? { fire: 0, eyes: 0, heart: 0 }) as {
    fire?: number;
    eyes?: number;
    heart?: number;
  };

  const editions = new Set(tickets.map((t: { event_id: string }) => t.event_id)).size;
  const meta = user.user_metadata ?? {};
  const phone =
    typeof meta.phone === 'string'
      ? meta.phone
      : typeof (profileRow?.settings as { phone?: string } | null)?.phone === 'string'
        ? (profileRow.settings as { phone: string }).phone
        : null;
  const firstName = typeof meta.first_name === 'string' ? meta.first_name : null;
  const lastName = typeof meta.last_name === 'string' ? meta.last_name : null;

  return NextResponse.json({
    profile: profileRow
      ? {
          ...profileRow,
          email: user.email ?? null,
          phone,
          first_name: firstName,
          last_name: lastName,
          tickets_count: tickets.length,
          editions_attended: editions,
        }
      : null,
    tickets,
    reactions: {
      fire: reactionTotals.fire ?? 0,
      eyes: reactionTotals.eyes ?? 0,
      heart: reactionTotals.heart ?? 0,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { display_name?: string; avatar_url?: string | null };
  const updates: { display_name?: string; avatar_url?: string | null } = {};

  if (typeof body.display_name === 'string') {
    const trimmed = body.display_name.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      return NextResponse.json({ error: 'Display name must be 1–80 characters' }, { status: 400 });
    }
    updates.display_name = trimmed;
  }

  if (body.avatar_url === null) {
    updates.avatar_url = null;
  } else if (typeof body.avatar_url === 'string' && body.avatar_url.trim()) {
    updates.avatar_url = body.avatar_url.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('handle, display_name, member_since, role, avatar_url')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
