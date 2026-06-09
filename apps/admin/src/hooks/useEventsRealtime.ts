'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';
import type { EventStatus } from '@/lib/eventPayload';
import { createClient } from '@/lib/supabase';

type EventRow = {
  id: string;
  status: EventStatus;
  name?: string;
  edition_number?: number;
};

type TierRow = {
  id: string;
  event_id: string;
  sold_count?: number;
  capacity?: number;
  status?: string;
};

export function useEventsRealtime({
  onEventUpdate,
  onTierUpdate,
}: {
  onEventUpdate: (row: EventRow) => void;
  onTierUpdate: (row: TierRow) => void;
}) {
  const supabase = createClient();
  const eventRef = useRef(onEventUpdate);
  const tierRef = useRef(onTierUpdate);

  useEffect(() => {
    eventRef.current = onEventUpdate;
    tierRef.current = onTierUpdate;
  }, [onEventUpdate, onTierUpdate]);

  useSupabaseRealtime<EventRow>({
    supabase,
    table: 'events',
    eventTypes: ['UPDATE'],
    onUpdate: (row) => eventRef.current(row),
  });

  useSupabaseRealtime<TierRow>({
    supabase,
    table: 'ticket_tiers',
    eventTypes: ['UPDATE'],
    debounceMs: 300,
    onUpdate: (row) => tierRef.current(row),
  });
}
