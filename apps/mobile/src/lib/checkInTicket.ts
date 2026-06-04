import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type Supabase = SupabaseClient<Database>;

export type CheckInResult =
  | { ok: true; ticketId: string; code: string }
  | { ok: false; error: string; status: number; checkedInAt?: string };

/**
 * Atomically mark a valid ticket as used. Blocks duplicate scans (one admission per ticket).
 */
export async function checkInTicketById(
  supabase: Supabase,
  ticketId: string,
): Promise<CheckInResult> {
  const now = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('tickets')
    .update({ checked_in_at: now, used_at: now, status: 'used' })
    .eq('id', ticketId)
    .eq('status', 'valid')
    .is('checked_in_at', null)
    .select('id, code')
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  if (updated) {
    return { ok: true, ticketId: updated.id, code: updated.code };
  }

  const { data: existing } = await supabase
    .from('tickets')
    .select('checked_in_at, status')
    .eq('id', ticketId)
    .maybeSingle();

  if (existing?.checked_in_at) {
    return {
      ok: false,
      error: 'Already checked in',
      status: 409,
      checkedInAt: existing.checked_in_at,
    };
  }

  return {
    ok: false,
    error: existing ? `Ticket is ${existing.status}` : 'Ticket not found',
    status: 409,
  };
}
