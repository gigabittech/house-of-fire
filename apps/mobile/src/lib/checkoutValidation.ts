import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { getTierAvailableCount, getUserEventTicketCount } from './ticketInventory';
import {
  clampOrderQuantity,
  MAX_TICKETS_PER_ORDER,
  MAX_TICKETS_PER_USER_PER_EVENT,
} from './ticketLimits';

type Supabase = SupabaseClient<Database>;

export type CheckoutValidationResult =
  | { ok: true; quantity: number }
  | { ok: false; error: string; status: number };

/**
 * Server-side checks before creating a PaymentIntent.
 * Use a service-role Supabase client so tier inventory is not limited by RLS.
 */
export async function validateCheckoutRequest(
  supabase: Supabase,
  params: {
    userId: string;
    tierId: string;
    quantity: unknown;
  },
): Promise<CheckoutValidationResult> {
  const quantity = clampOrderQuantity(params.quantity);

  if (quantity < 1 || quantity > MAX_TICKETS_PER_ORDER) {
    return {
      ok: false,
      error: `Quantity must be between 1 and ${MAX_TICKETS_PER_ORDER}`,
      status: 400,
    };
  }

  const { data: tier, error: tierError } = await supabase
    .from('ticket_tiers')
    .select('id, event_id, status, capacity')
    .eq('id', params.tierId)
    .single();

  if (tierError || !tier) {
    return { ok: false, error: 'Tier not found', status: 404 };
  }

  if (tier.status === 'sold_out' || tier.status === 'hidden') {
    return { ok: false, error: 'Tier not available', status: 400 };
  }

  const availability = await getTierAvailableCount(supabase, params.tierId);
  if ('error' in availability) {
    console.error('[checkout] tier availability:', availability.error);
    return { ok: false, error: 'Could not check availability', status: 500 };
  }

  if (availability.available < quantity) {
    return {
      ok: false,
      error:
        availability.available <= 0
          ? 'This tier is sold out'
          : `Only ${availability.available} ticket${availability.available === 1 ? '' : 's'} left for this tier`,
      status: 400,
    };
  }

  const userTickets = await getUserEventTicketCount(supabase, params.userId, tier.event_id);
  if ('error' in userTickets) {
    console.error('[checkout] user ticket count:', userTickets.error);
    return { ok: false, error: 'Could not verify ticket limit', status: 500 };
  }

  const remaining = MAX_TICKETS_PER_USER_PER_EVENT - userTickets.count;

  if (remaining <= 0) {
    return {
      ok: false,
      error: `You already have the maximum of ${MAX_TICKETS_PER_USER_PER_EVENT} tickets for this event`,
      status: 400,
    };
  }

  if (quantity > remaining) {
    return {
      ok: false,
      error: `You can only add ${remaining} more ticket${remaining === 1 ? '' : 's'} for this event (limit ${MAX_TICKETS_PER_USER_PER_EVENT} per account)`,
      status: 400,
    };
  }

  return { ok: true, quantity };
}

/** Re-check availability at fulfillment time to prevent overselling. */
export async function validateTierCapacityForFulfillment(
  supabase: Supabase,
  tierId: string,
  quantity: number,
): Promise<CheckoutValidationResult> {
  const availability = await getTierAvailableCount(supabase, tierId);
  if ('error' in availability) {
    return { ok: false, error: 'Could not verify inventory', status: 500 };
  }

  if (availability.available < quantity) {
    return { ok: false, error: 'Not enough tickets available', status: 409 };
  }

  return { ok: true, quantity };
}
