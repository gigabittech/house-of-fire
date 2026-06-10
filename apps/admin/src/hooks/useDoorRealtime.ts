'use client';

import { useSupabaseRealtime, useRealtimeStatus } from '@hof/realtime';
import { useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

type TicketRow = {
  id: string;
  event_id: string;
  status: string;
  source?: string | null;
  stripe_charge_id?: string | null;
  checked_in_at?: string | null;
  used_at?: string | null;
};

function isWalkup(t: TicketRow): boolean {
  return t.source === 'door' || (t.stripe_charge_id ?? '').startsWith('door-');
}

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
  onCheckIn?: () => void;
  onResync?: () => void;
};

export function useDoorRealtime({
  eventId,
  enabled = true,
  onTicketChange,
  onCheckIn,
  onResync,
}: UseDoorRealtimeOptions) {
  const supabase = createClient();
  const callbacksRef = useRef({ onTicketChange, onCheckIn, onResync });
  const { status: globalStatus } = useRealtimeStatus();

  useEffect(() => {
    callbacksRef.current = { onTicketChange, onCheckIn, onResync };
  }, [onTicketChange, onCheckIn, onResync]);

  const handleInsert = useCallback((row: TicketRow) => {
    const delta: DoorStatsDelta = { soldDelta: 1, remainingDelta: -1 };
    if (row.status === 'used') delta.scannedDelta = 1;
    if (isWalkup(row)) delta.walkupDelta = 1;
    callbacksRef.current.onTicketChange?.(delta);
    if (row.status === 'used') callbacksRef.current.onCheckIn?.();
  }, []);

  const handleUpdate = useCallback((row: TicketRow, oldRow: Partial<TicketRow>) => {
    if (oldRow.status !== 'used' && row.status === 'used') {
      callbacksRef.current.onTicketChange?.({ scannedDelta: 1 });
      callbacksRef.current.onCheckIn?.();
    }
  }, []);

  const filter = eventId ? `event_id=eq.${eventId}` : undefined;

  const { status } = useSupabaseRealtime<TicketRow>({
    supabase,
    table: 'tickets',
    filter,
    eventTypes: ['INSERT', 'UPDATE'],
    enabled: enabled && !!eventId,
    debounceMs: 300,
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onResync: () => callbacksRef.current.onResync?.(),
  });

  // Fallback polling when disconnected (60s safety net)
  useEffect(() => {
    if (!eventId || !enabled) return;
    if (globalStatus !== 'disconnected' && globalStatus !== 'error') return;
    const id = setInterval(() => callbacksRef.current.onResync?.(), 60_000);
    return () => clearInterval(id);
  }, [eventId, enabled, globalStatus]);

  return { status };
}

export function useDoorTierRealtime({
  eventId,
  enabled = true,
  onTierUpdate,
}: {
  eventId: string | null;
  enabled?: boolean;
  onTierUpdate?: () => void;
}) {
  const supabase = createClient();
  const onTierRef = useRef(onTierUpdate);
  useEffect(() => {
    onTierRef.current = onTierUpdate;
  }, [onTierUpdate]);

  return useSupabaseRealtime({
    supabase,
    table: 'ticket_tiers',
    filter: eventId ? `event_id=eq.${eventId}` : undefined,
    eventTypes: ['UPDATE'],
    enabled: enabled && !!eventId,
    debounceMs: 300,
    onUpdate: () => onTierRef.current?.(),
    onResync: () => onTierRef.current?.(),
  });
}
