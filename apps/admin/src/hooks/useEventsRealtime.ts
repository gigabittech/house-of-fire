'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';
import type { EventStatus } from '@/lib/eventPayload';

type EventRow = {
  id: string;
  status: EventStatus;
  name?: string;
  edition_number?: number;
};

/** Event status changes only — tier inventory uses snapshot polling (no ticket_tiers realtime). */
export function useEventsRealtime({
  onEventUpdate,
}: {
  onEventUpdate: (row: EventRow) => void;
}) {
  const eventRef = useRef(onEventUpdate);

  useEffect(() => {
    eventRef.current = onEventUpdate;
  }, [onEventUpdate]);

  useSupabaseRealtime<EventRow>({
    table: 'events',
    eventTypes: ['UPDATE'],
    onUpdate: (row) => eventRef.current(row),
  });
}
