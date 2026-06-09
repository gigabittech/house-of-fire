import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const EVENT_SLUG_SELECT =
  'id, edition_number, name, date, venue_name, status' as const;

export type EventSlugRow = Pick<
  Database['public']['Tables']['events']['Row'],
  'id' | 'edition_number' | 'name' | 'date' | 'venue_name' | 'status'
>;

export function parseEventSlug(
  slug: string,
): { type: 'edition'; edition: number } | { type: 'id'; id: string } {
  if (/^\d+$/.test(slug)) {
    return { type: 'edition', edition: Number(slug) };
  }
  return { type: 'id', id: slug };
}

export function archiveThemePath(edition: number): string {
  return `/archive/${edition}`;
}

export async function fetchEventBySlug(
  supabase: SupabaseClient<Database>,
  slug: string,
) {
  const parsed = parseEventSlug(slug);
  if (parsed.type === 'edition') {
    return supabase
      .from('events')
      .select(EVENT_SLUG_SELECT)
      .eq('edition_number', parsed.edition)
      .single();
  }
  return supabase.from('events').select(EVENT_SLUG_SELECT).eq('id', parsed.id).single();
}
