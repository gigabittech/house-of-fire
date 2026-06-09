'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

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
  enabled = true,
}: {
  userId: string | null | undefined;
  onTicketUpdate: (row: TicketRow) => void;
  enabled?: boolean;
}) {
  const supabase = createClient();
  const onUpdateRef = useRef(onTicketUpdate);

  useEffect(() => {
    onUpdateRef.current = onTicketUpdate;
  }, [onTicketUpdate]);

  useSupabaseRealtime<TicketRow>({
    supabase,
    table: 'tickets',
    filter: userId ? `holder_id=eq.${userId}` : undefined,
    eventTypes: ['INSERT', 'UPDATE'],
    enabled: enabled && !!userId,
    onInsert: (row) => onUpdateRef.current(row),
    onUpdate: (row) => onUpdateRef.current(row),
  });
}
