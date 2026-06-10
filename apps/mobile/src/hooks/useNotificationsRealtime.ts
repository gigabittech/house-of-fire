'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

type NotificationRow = {
  id: string;
  user_id: string;
  kind?: string;
  title?: string;
  body?: string;
  read?: boolean;
  created_at?: string;
  post_id?: string | null;
  [key: string]: unknown;
};

export function useNotificationsRealtime({
  userId,
  onNotification,
  enabled = true,
}: {
  userId: string | null | undefined;
  onNotification: (row: NotificationRow) => void;
  enabled?: boolean;
}) {
  const supabase = createClient();
  const onNotifRef = useRef(onNotification);

  useEffect(() => {
    onNotifRef.current = onNotification;
  }, [onNotification]);

  useSupabaseRealtime<NotificationRow>({
    supabase,
    table: 'notifications',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    eventTypes: ['INSERT'],
    enabled: enabled && !!userId,
    onInsert: (row) => onNotifRef.current(row),
  });
}
