'use client';

import { useSupabaseRealtime, useRealtimeStatus } from '@hof/realtime';
import { useCallback, useEffect, useRef } from 'react';
import type { TicketRealtimeRow } from '@/lib/realtimePatch';
import { isWalkupTicket } from '@/lib/realtimePatch';

export type DoorStatsDelta = {
  soldDelta?: number;
  scannedDelta?: number;
  walkupDelta?: number;
  remainingDelta?: number;
};

type UseDoorRealtimeOptions = {
  eventId: string | null;
  enabled?: boolean;
  onTicketChange?: (delta: DoorStatsDelta) => void;
  onTicketInsert?: (row: TicketRealtimeRow) => void;
  onCheckIn?: () => void;
  onResync?: () => void;
};

export function useDoorRealtime({
  eventId,
  enabled = true,
  onTicketChange,
  onTicketInsert,
  onCheckIn,
  onResync,
}: UseDoorRealtimeOptions) {
  const callbacksRef = useRef({ onTicketChange, onTicketInsert, onCheckIn, onResync });
  const { status: globalStatus } = useRealtimeStatus();

  useEffect(() => {
    callbacksRef.current = { onTicketChange, onTicketInsert, onCheckIn, onResync };
  }, [onTicketChange, onTicketInsert, onCheckIn, onResync]);

  const handleInsert = useCallback((row: TicketRealtimeRow) => {
    const delta: DoorStatsDelta = { soldDelta: 1, remainingDelta: -1 };
    if (row.status === 'used') delta.scannedDelta = 1;
    if (isWalkupTicket(row)) delta.walkupDelta = 1;
    callbacksRef.current.onTicketChange?.(delta);
    callbacksRef.current.onTicketInsert?.(row);
    if (row.status === 'used') callbacksRef.current.onCheckIn?.();
  }, []);

  const handleUpdate = useCallback((row: TicketRealtimeRow, oldRow: Partial<TicketRealtimeRow>) => {
    if (oldRow.status !== 'used' && row.status === 'used') {
      callbacksRef.current.onTicketChange?.({ scannedDelta: 1 });
      callbacksRef.current.onCheckIn?.();
    }
  }, []);

  const filter = eventId ? `event_id=eq.${eventId}` : undefined;

  const { status } = useSupabaseRealtime<TicketRealtimeRow>({
    table: 'tickets',
    filter,
    eventTypes: ['INSERT', 'UPDATE'],
    enabled: enabled && !!eventId,
    debounceMs: 150,
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onResync: () => callbacksRef.current.onResync?.(),
  });

  useEffect(() => {
    if (!eventId || !enabled) return;
    if (globalStatus !== 'disconnected' && globalStatus !== 'error') return;
    const id = setInterval(() => callbacksRef.current.onResync?.(), 60_000);
    return () => clearInterval(id);
  }, [eventId, enabled, globalStatus]);

  return { status };
}
