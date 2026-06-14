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
    .eq('visibility', 'public')
    .order('edition_number', { ascending: false })
    .limit(1)
    .maybeSingle();
}

/** Returns the highest-edition live public event, or null when none is live. */
export async function getActiveEvent<T extends string = '*'>(
  supabase: EventsClient,
  select: T = '*' as T,
) {
  return getLiveEvent(supabase, select);
}
