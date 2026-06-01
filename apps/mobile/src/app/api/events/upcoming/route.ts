import { NextResponse } from 'next/server.js';
import { createServerSupabaseClient } from '../../../../lib/supabase.server.js';
import type { Database } from '../../../../lib/database.types.js';

type TicketTierRow = Database['public']['Tables']['ticket_tiers']['Row'];

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'upcoming')
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

  return NextResponse.json({ event: { ...event, ticket_tiers: (tiers ?? []) as TicketTierRow[] } });
}
