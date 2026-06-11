'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';

type TicketRow = {
  id: string;
  status: string;
  holder_id?: string | null;
  checked_in_at?: string | null;
  used_at?: string | null;
};

export function useTicketRealtime({
  userId,
  onTicketUpdate,
  onTicketDelete,
  enabled = true,
}: {
  userId: string | null | undefined;
  onTicketUpdate: (row: TicketRow) => void;
  onTicketDelete?: (oldRow: Partial<TicketRow>) => void;
  enabled?: boolean;
}) {
  const onUpdateRef = useRef(onTicketUpdate);
  const onDeleteRef = useRef(onTicketDelete);

  useEffect(() => {
    onUpdateRef.current = onTicketUpdate;
    onDeleteRef.current = onTicketDelete;
  }, [onTicketUpdate, onTicketDelete]);

  useSupabaseRealtime<TicketRow>({
    table: 'tickets',
    filter: userId ? `holder_id=eq.${userId}` : undefined,
    eventTypes: ['INSERT', 'UPDATE', 'DELETE'],
    enabled: enabled && !!userId,
    onInsert: (row) => onUpdateRef.current(row),
    onUpdate: (row) => onUpdateRef.current(row),
    onDelete: (oldRow) => onDeleteRef.current?.(oldRow),
  });
}
