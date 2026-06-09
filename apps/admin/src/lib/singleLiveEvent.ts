import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export const SINGLE_LIVE_EVENT_ERROR =
  'Another event is already live. Change its status before setting this one to Live.';

export async function assertSingleLiveEvent(
  supabase: SupabaseClient<Database>,
  status: string | undefined,
  excludeEventId?: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (status !== 'live') return { ok: true };

  let query = supabase.from('events').select('id').eq('status', 'live').limit(1);
  if (excludeEventId) {
    query = query.neq('id', excludeEventId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }
  if (data) {
    return { ok: false, error: SINGLE_LIVE_EVENT_ERROR, status: 409 };
  }

  return { ok: true };
}
