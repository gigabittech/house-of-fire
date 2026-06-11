'use client';

import { useCallback, useEffect, useRef } from 'react';
import { applyInventorySnapshot, type InventorySnapshot } from '@/lib/inventorySnapshot';
import type { UpcomingEvent } from '@/lib/eventDisplay';

/** Polling intervals tuned for launch traffic (bounded RPS vs realtime storms). */
export const INVENTORY_POLL_MS = {
  home: 8_000,
  event: 6_000,
  checkout: 4_000,
} as const;

/**
 * Hybrid inventory sync: poll cached snapshot API instead of ticket_tiers realtime.
 * Accurate within poll interval; safe for thousands of concurrent viewers.
 */
export function useEventInventory({
  event,
  onEventChange,
  enabled = true,
  pollIntervalMs = INVENTORY_POLL_MS.event,
}: {
  event: UpcomingEvent | null;
  onEventChange: (next: UpcomingEvent) => void;
  enabled?: boolean;
  pollIntervalMs?: number;
}) {
  const eventRef = useRef(event);
  const onChangeRef = useRef(onEventChange);

  useEffect(() => {
    eventRef.current = event;
    onChangeRef.current = onEventChange;
  }, [event, onEventChange]);

  const fetchInventory = useCallback(async () => {
    const current = eventRef.current;
    if (!current?.id) return;
    try {
      const res = await fetch(`/api/events/${current.id}/inventory`);
      if (!res.ok) return;
      const data = (await res.json()) as InventorySnapshot;
      if (!data.tiers) return;
      onChangeRef.current(applyInventorySnapshot(current, data));
    } catch {
      /* keep prior snapshot */
    }
  }, []);

  useEffect(() => {
    if (!enabled || !event?.id) return;

    void fetchInventory();

    const intervalId = setInterval(() => void fetchInventory(), pollIntervalMs);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void fetchInventory();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, event?.id, pollIntervalMs, fetchInventory]);
}
