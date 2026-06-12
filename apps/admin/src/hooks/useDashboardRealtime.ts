'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';
import type { TicketRealtimeRow } from '@/lib/realtimePatch';

type RefundRow = { status?: string };
type PhotoRow = { id: string; status?: string; event_id?: string };

export function useDashboardRealtime({
  eventId,
  onTicketInsert,
  onTicketUpdate,
  onRefundInsert,
  onRefundUpdate,
  onPhotoInsert,
  onPhotoUpdate,
  onResync,
  enabled = true,
}: {
  eventId: string | null | undefined;
  onTicketInsert?: (row: TicketRealtimeRow) => void;
  onTicketUpdate?: (row: TicketRealtimeRow, oldRow: Partial<TicketRealtimeRow>) => void;
  onRefundInsert?: (row: RefundRow) => void;
  onRefundUpdate?: (row: RefundRow, oldRow: Partial<RefundRow>) => void;
  onPhotoInsert?: (row: PhotoRow) => void;
  onPhotoUpdate?: (row: PhotoRow, oldRow: Partial<PhotoRow>) => void;
  onResync?: () => void;
  enabled?: boolean;
}) {
  const callbacksRef = useRef({
    onTicketInsert,
    onTicketUpdate,
    onRefundInsert,
    onRefundUpdate,
    onPhotoInsert,
    onPhotoUpdate,
    onResync,
  });

  useEffect(() => {
    callbacksRef.current = {
      onTicketInsert,
      onTicketUpdate,
      onRefundInsert,
      onRefundUpdate,
      onPhotoInsert,
      onPhotoUpdate,
      onResync,
    };
  }, [
    onTicketInsert,
    onTicketUpdate,
    onRefundInsert,
    onRefundUpdate,
    onPhotoInsert,
    onPhotoUpdate,
    onResync,
  ]);

  const scoped = eventId ? `event_id=eq.${eventId}` : undefined;

  useSupabaseRealtime<TicketRealtimeRow>({
    table: 'tickets',
    filter: scoped,
    eventTypes: ['INSERT', 'UPDATE'],
    enabled: enabled && !!eventId,
    debounceMs: 150,
    onInsert: (row) => callbacksRef.current.onTicketInsert?.(row),
    onUpdate: (row, oldRow) => callbacksRef.current.onTicketUpdate?.(row, oldRow),
    onResync: () => callbacksRef.current.onResync?.(),
  });

  useSupabaseRealtime<RefundRow>({
    table: 'refund_requests',
    filter: 'status=eq.pending',
    eventTypes: ['INSERT', 'UPDATE', 'DELETE'],
    enabled,
    debounceMs: 300,
    onInsert: (row) => callbacksRef.current.onRefundInsert?.(row),
    onUpdate: (row, oldRow) => callbacksRef.current.onRefundUpdate?.(row, oldRow),
    onDelete: () =>
      callbacksRef.current.onRefundUpdate?.({ status: 'processed' }, { status: 'pending' }),
  });

  useSupabaseRealtime<PhotoRow>({
    table: 'event_photos',
    filter: 'status=eq.pending',
    eventTypes: ['INSERT', 'UPDATE', 'DELETE'],
    enabled,
    debounceMs: 300,
    onInsert: (row) => callbacksRef.current.onPhotoInsert?.(row),
    onUpdate: (row, oldRow) => callbacksRef.current.onPhotoUpdate?.(row, oldRow),
    onDelete: (oldRow) =>
      callbacksRef.current.onPhotoUpdate?.(
        { id: String(oldRow.id), status: 'approved' },
        { status: 'pending' },
      ),
  });
}
