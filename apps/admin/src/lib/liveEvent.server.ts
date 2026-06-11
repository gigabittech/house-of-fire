import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type EventsClient = SupabaseClient<Database>;

export const NO_EVENTS_MESSAGE = 'There are currently no events available.';

export async function getLiveEvent<T extends string = '*'>(
  supabase: EventsClient,
  select: T = '*' as T,
) {
  return supabase
    .from('events')
    .select(select)
    .eq('status', 'live')
    .order('edition_number', { ascending: false })
    .limit(1)
    .maybeSingle();
}

/** Returns the highest-edition live event, or upcoming if none is live. */
export async function getActiveEvent<T extends string = '*'>(
  supabase: EventsClient,
  select: T = '*' as T,
) {
  const { data: live, error: liveError } = await getLiveEvent(supabase, select);
  if (liveError) return { data: null, error: liveError };
  if (live) return { data: live, error: null };

  return supabase
    .from('events')
    .select(select)
    .eq('status', 'upcoming')
    .order('edition_number', { ascending: false })
    .limit(1)
    .maybeSingle();
}
