'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

type PostRow = { moderation_status?: string };
type PhotoRow = { status?: string };

export function useNavCountsRealtime({
  onMediaPending,
  onModPending,
}: {
  onMediaPending: () => void;
  onModPending: () => void;
}) {
  const supabase = createClient();
  const callbacksRef = useRef({ onMediaPending, onModPending });

  useEffect(() => {
    callbacksRef.current = { onMediaPending, onModPending };
  }, [onMediaPending, onModPending]);

  useSupabaseRealtime<PhotoRow>({
    supabase,
    table: 'event_photos',
    filter: 'status=eq.pending',
    eventTypes: ['INSERT', 'UPDATE'],
    onInsert: () => callbacksRef.current.onMediaPending(),
    onUpdate: (row) => {
      if (row.status === 'pending') callbacksRef.current.onMediaPending();
    },
  });

  useSupabaseRealtime<PostRow>({
    supabase,
    table: 'posts',
    filter: 'moderation_status=eq.pending',
    eventTypes: ['INSERT', 'UPDATE'],
    onInsert: () => callbacksRef.current.onModPending(),
    onUpdate: (row) => {
      if (row.moderation_status === 'pending') callbacksRef.current.onModPending();
    },
  });
}
