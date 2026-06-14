import type { ActiveEvent, EventTier } from '@/lib/eventDisplay';

export type InventoryTierSnapshot = {
  id: string;
  name: string;
  display_name?: string | null;
  description?: string | null;
  price_cents: number;
  fee_cents?: number;
  capacity: number;
  status?: string;
  sort_order?: number;
  sold: number;
  remaining: number;
  effective_status: 'available' | 'sold_out' | 'hidden';
};

export type InventorySnapshot = {
  event: {
    id: string;
    status?: string;
    name?: string;
    edition_number?: number;
    capacity?: number;
    updated_at?: string;
  };
  tiers: InventoryTierSnapshot[];
  snapshot_at?: string;
};

function snapshotTierToUpcoming(tier: InventoryTierSnapshot): EventTier {
  return {
    id: tier.id,
    name: tier.name,
    display_name: tier.display_name,
    description: tier.description,
    price_cents: tier.price_cents,
    fee_cents: tier.fee_cents,
    capacity: tier.capacity,
    sold: tier.sold,
    remaining: tier.remaining,
    status: tier.effective_status,
    effective_status: tier.effective_status,
  };
}

/** Merge a polled inventory snapshot into the current event (preserves user-specific fields). */
export function applyInventorySnapshot(
  current: ActiveEvent,
  snapshot: InventorySnapshot,
): ActiveEvent {
  const tiers = snapshot.tiers.map(snapshotTierToUpcoming);
  return {
    ...current,
    status: (snapshot.event.status as ActiveEvent['status']) ?? current.status,
    name: snapshot.event.name ?? current.name,
    edition_number: snapshot.event.edition_number ?? current.edition_number,
    capacity: snapshot.event.capacity ?? current.capacity,
    ticket_tiers: tiers,
  };
}
