import { NextResponse } from 'next/server.js';
import { createServerSupabaseClient } from '../../../lib/supabase.server.js';
import type { Json } from '../../../lib/database.types.js';

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

  const profile = profileRes.data;
  const tickets = ticketsRes.data ?? [];
  const posts = postsRes.data ?? [];

  // Compute stats
  const editions = new Set(tickets.map((t: { event_id: string }) => t.event_id)).size;

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
    profile,
    email: user.email,
    stats: { editions, ticketCount: tickets.length },
    reactions: { fire: totalFire, eyes: totalEyes, heart: totalHeart },
    tickets: tickets.slice(0, 5), // Most recent 5
  });
}
