import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type Supabase = SupabaseClient<Database>;

/** Ticket statuses that consume tier capacity / count toward user limits. */
const ACTIVE_TICKET_STATUSES = ['valid', 'used'] as const;

export async function getTierAvailableCount(
  supabase: Supabase,
  tierId: string,
): Promise<{ available: number } | { error: string }> {
  const { data: tier, error: tierError } = await supabase
    .from('ticket_tiers')
    .select('capacity')
    .eq('id', tierId)
    .single();

  if (tierError || !tier) {
    return { error: tierError?.message ?? 'Tier not found' };
  }

  const { count, error: countError } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('tier_id', tierId)
    .in('status', [...ACTIVE_TICKET_STATUSES]);

  if (countError) {
    return { error: countError.message };
  }

  const sold = count ?? 0;
  return { available: Math.max(0, tier.capacity - sold) };
}

export async function getUserEventTicketCount(
  supabase: Supabase,
  userId: string,
  eventId: string,
): Promise<{ count: number } | { error: string }> {
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('holder_id', userId)
    .eq('event_id', eventId)
    .in('status', [...ACTIVE_TICKET_STATUSES]);

  if (error) {
    return { error: error.message };
  }

  return { count: count ?? 0 };
}
