'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

type UseDashboardRealtimeOptions = {
  eventId: string | null | undefined;
  onMetricsResync: () => void;
  onGuestsResync: () => void;
  onPhotosResync?: () => void;
  enabled?: boolean;
};

export function useDashboardRealtime({
  eventId,
  onMetricsResync,
  onGuestsResync,
  onPhotosResync,
  enabled = true,
}: UseDashboardRealtimeOptions) {
  const supabase = createClient();
  const callbacksRef = useRef({
    onMetricsResync,
    onGuestsResync,
    onPhotosResync,
  });

  useEffect(() => {
    callbacksRef.current = { onMetricsResync, onGuestsResync, onPhotosResync };
  }, [onMetricsResync, onGuestsResync, onPhotosResync]);

  const ticketFilter = eventId ? `event_id=eq.${eventId}` : undefined;
  const orderFilter = eventId ? `event_id=eq.${eventId}` : undefined;
  const tierFilter = eventId ? `event_id=eq.${eventId}` : undefined;

  useSupabaseRealtime({
    supabase,
    table: 'tickets',
    filter: ticketFilter,
    eventTypes: ['INSERT', 'UPDATE'],
    enabled: enabled && !!eventId,
    debounceMs: 300,
    onInsert: () => {
      callbacksRef.current.onMetricsResync();
      callbacksRef.current.onGuestsResync();
    },
    onUpdate: () => {
      callbacksRef.current.onMetricsResync();
      callbacksRef.current.onGuestsResync();
    },
    onResync: () => callbacksRef.current.onMetricsResync(),
  });

  useSupabaseRealtime({
    supabase,
    table: 'orders',
    filter: orderFilter,
    eventTypes: ['INSERT'],
    enabled: enabled && !!eventId,
    debounceMs: 300,
    onInsert: () => callbacksRef.current.onMetricsResync(),
    onResync: () => callbacksRef.current.onMetricsResync(),
  });

  useSupabaseRealtime({
    supabase,
    table: 'ticket_tiers',
    filter: tierFilter,
    eventTypes: ['UPDATE'],
    enabled: enabled && !!eventId,
    debounceMs: 300,
    onUpdate: () => callbacksRef.current.onMetricsResync(),
  });

  useSupabaseRealtime({
    supabase,
    table: 'refund_requests',
    eventTypes: ['INSERT', 'UPDATE'],
    enabled,
    debounceMs: 300,
    onInsert: () => callbacksRef.current.onMetricsResync(),
    onUpdate: () => callbacksRef.current.onMetricsResync(),
  });

  useSupabaseRealtime({
    supabase,
    table: 'event_photos',
    filter: 'status=eq.pending',
    eventTypes: ['INSERT', 'UPDATE'],
    enabled,
    debounceMs: 300,
    onInsert: () => callbacksRef.current.onPhotosResync?.(),
    onUpdate: () => callbacksRef.current.onPhotosResync?.(),
  });
}
