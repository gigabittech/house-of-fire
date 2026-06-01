import { NextResponse, type NextRequest } from 'next/server.js';
import { createServerSupabaseClient } from '../../../../../lib/supabase.server.js';
import type { Database } from '../../../../../lib/database.types.js';

type ArtistRow = Database['public']['Tables']['artists']['Row'];
type LineupRow = Database['public']['Tables']['event_lineups']['Row'];

interface LineupEntry {
  artist: ArtistRow;
  set_time: string | null;
  role: LineupRow['role'];
  sort_order: number;
}

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { eventId } = await context.params;

  const supabase = await createServerSupabaseClient();

  const { data: lineupRows, error } = await supabase
    .from('event_lineups')
    .select('sort_order, set_time, role, artists(*)')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const lineup: LineupEntry[] = (lineupRows ?? []).flatMap((row) => {
    const artist = Array.isArray(row.artists) ? row.artists[0] : row.artists;
    if (!artist) return [];
    return [
      {
        artist: artist as ArtistRow,
        set_time: row.set_time,
        role: row.role as LineupRow['role'],
        sort_order: row.sort_order,
      },
    ];
  });

  return NextResponse.json({ lineup });
}
