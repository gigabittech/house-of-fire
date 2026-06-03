import { NextResponse } from 'next/server';
import type { Json } from '../../../lib/database.types';
import { createServerSupabaseClient } from '../../../lib/supabase.server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [profileRes, ticketsRes, postsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('tickets')
      .select('*, events(*), ticket_tiers(*)')
      .eq('holder_id', user.id)
      .order('purchased_at', { ascending: false }),
    supabase.from('posts').select('id, reaction_counts').eq('author_id', user.id),
  ]);

  if (profileRes.error) {
    return NextResponse.json({ error: profileRes.error.message }, { status: 500 });
  }

  const profileRow = profileRes.data;
  const tickets = ticketsRes.data ?? [];
  const posts = postsRes.data ?? [];

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

  const totalFire = posts.reduce(
    (sum: number, p: { reaction_counts: Json }) =>
      sum + ((p.reaction_counts as Record<string, number>)?.fire ?? 0),
    0,
  );
  const totalEyes = posts.reduce(
    (sum: number, p: { reaction_counts: Json }) =>
      sum + ((p.reaction_counts as Record<string, number>)?.eyes ?? 0),
    0,
  );
  const totalHeart = posts.reduce(
    (sum: number, p: { reaction_counts: Json }) =>
      sum + ((p.reaction_counts as Record<string, number>)?.heart ?? 0),
    0,
  );

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
    reactions: { fire: totalFire, eyes: totalEyes, heart: totalHeart },
  });
}
