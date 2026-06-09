'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';
import type { UpcomingEvent, UpcomingTier } from '@/lib/eventDisplay';
import { createClient } from '@/lib/supabase';

type EventRow = { id: string; status?: string; name?: string };
type TierRow = {
  id: string;
  event_id: string;
  sold_count?: number;
  capacity?: number;
  status?: string;
};

function patchTierFromRow(tier: UpcomingTier, row: TierRow): UpcomingTier {
  const sold = row.sold_count ?? tier.sold ?? 0;
  const capacity = row.capacity ?? tier.capacity;
  const remaining = Math.max(0, capacity - sold);
  const effective_status =
    tier.status === 'hidden'
      ? 'hidden'
      : tier.status === 'sold_out' || remaining <= 0
        ? 'sold_out'
        : 'available';
  return {
    ...tier,
    sold,
    remaining,
    effective_status,
    status: effective_status,
  };
}

export function useEventInventoryRealtime({
  event,
  onEventChange,
  enabled = true,
}: {
  event: UpcomingEvent | null;
  onEventChange: (next: UpcomingEvent) => void;
  enabled?: boolean;
}) {
  const supabase = createClient();
  const eventRef = useRef(event);
  const onChangeRef = useRef(onEventChange);

  useEffect(() => {
    eventRef.current = event;
    onChangeRef.current = onEventChange;
  }, [event, onEventChange]);

  const eventId = event?.id;

  useSupabaseRealtime<EventRow>({
    supabase,
    table: 'events',
    filter: eventId ? `id=eq.${eventId}` : undefined,
    eventTypes: ['UPDATE'],
    enabled: enabled && !!eventId,
    onUpdate: (row) => {
      const current = eventRef.current;
      if (!current || current.id !== row.id) return;
      onChangeRef.current({ ...current, status: (row.status as UpcomingEvent['status']) ?? current.status });
    },
    onResync: () => {
      void fetch('/api/events/upcoming')
        .then((r) => r.json())
        .then((d: { event?: UpcomingEvent }) => {
          if (d.event) onChangeRef.current(d.event);
        })
        .catch(() => {});
    },
  });

  useSupabaseRealtime<TierRow>({
    supabase,
    table: 'ticket_tiers',
    filter: eventId ? `event_id=eq.${eventId}` : undefined,
    eventTypes: ['UPDATE'],
    enabled: enabled && !!eventId,
    debounceMs: 300,
    onUpdate: (row) => {
      const current = eventRef.current;
      if (!current?.ticket_tiers) return;
      const tiers = current.ticket_tiers.map((t) =>
        t.id === row.id ? patchTierFromRow(t, row) : t,
      );
      onChangeRef.current({ ...current, ticket_tiers: tiers });
    },
  });
}
