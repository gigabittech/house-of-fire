'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';
import type { TicketRealtimeRow } from '@/lib/realtimePatch';

export function useGuestsRealtime({
  eventId,
  onTicketInsert,
  onTicketUpdate,
  onTicketDelete,
  onResync,
  enabled = true,
}: {
  eventId: string;
  onTicketInsert?: (row: TicketRealtimeRow) => void;
  onTicketUpdate?: (row: TicketRealtimeRow, oldRow: Partial<TicketRealtimeRow>) => void;
  onTicketDelete?: (oldRow: Partial<TicketRealtimeRow>) => void;
  onResync?: () => void;
  enabled?: boolean;
}) {
  const callbacksRef = useRef({
    onTicketInsert,
    onTicketUpdate,
    onTicketDelete,
    onResync,
  });

  useEffect(() => {
    callbacksRef.current = {
      onTicketInsert,
      onTicketUpdate,
      onTicketDelete,
      onResync,
    };
  }, [onTicketInsert, onTicketUpdate, onTicketDelete, onResync]);

  const ticketFilter = eventId ? `event_id=eq.${eventId}` : undefined;

  useSupabaseRealtime<TicketRealtimeRow>({
    table: 'tickets',
    filter: ticketFilter,
    eventTypes: ['INSERT', 'UPDATE', 'DELETE'],
    enabled: enabled && !!eventId,
    debounceMs: 150,
    onInsert: (row) => callbacksRef.current.onTicketInsert?.(row),
    onUpdate: (row, oldRow) => callbacksRef.current.onTicketUpdate?.(row, oldRow),
    onDelete: (oldRow) => callbacksRef.current.onTicketDelete?.(oldRow),
    onResync: () => callbacksRef.current.onResync?.(),
  });
}
