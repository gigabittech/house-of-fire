'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

export function useGuestsRealtime({
  eventId,
  onResync,
  onTierStatusResync,
  enabled = true,
}: {
  eventId: string;
  onResync: () => void;
  onTierStatusResync: () => void;
  enabled?: boolean;
}) {
  const supabase = createClient();
  const onResyncRef = useRef(onResync);
  const onTierRef = useRef(onTierStatusResync);

  useEffect(() => {
    onResyncRef.current = onResync;
    onTierRef.current = onTierStatusResync;
  }, [onResync, onTierStatusResync]);

  const filter = eventId ? `event_id=eq.${eventId}` : undefined;

  useSupabaseRealtime({
    supabase,
    table: 'tickets',
    filter,
    eventTypes: ['INSERT', 'UPDATE'],
    enabled: enabled && !!eventId,
    debounceMs: 300,
    onInsert: () => onResyncRef.current(),
    onUpdate: () => onResyncRef.current(),
    onResync: () => onResyncRef.current(),
  });

  useSupabaseRealtime({
    supabase,
    table: 'ticket_tiers',
    filter,
    eventTypes: ['UPDATE'],
    enabled: enabled && !!eventId,
    debounceMs: 300,
    onUpdate: () => onTierRef.current(),
    onResync: () => onTierRef.current(),
  });
}
