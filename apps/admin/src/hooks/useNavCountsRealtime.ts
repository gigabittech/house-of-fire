'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';

type PostRow = { moderation_status?: string };
type PhotoRow = { status?: string };

export function useNavCountsRealtime({
  onMediaDelta,
  onModDelta,
}: {
  onMediaDelta: (delta: number) => void;
  onModDelta: (delta: number) => void;
}) {
  const callbacksRef = useRef({ onMediaDelta, onModDelta });

  useEffect(() => {
    callbacksRef.current = { onMediaDelta, onModDelta };
  }, [onMediaDelta, onModDelta]);

  useSupabaseRealtime<PhotoRow>({
    table: 'event_photos',
    filter: 'status=eq.pending',
    eventTypes: ['INSERT', 'UPDATE', 'DELETE'],
    onInsert: () => callbacksRef.current.onMediaDelta(1),
    onUpdate: (row, oldRow) => {
      const wasPending = oldRow.status === 'pending';
      const isPending = row.status === 'pending';
      if (!wasPending && isPending) callbacksRef.current.onMediaDelta(1);
      if (wasPending && !isPending) callbacksRef.current.onMediaDelta(-1);
    },
    onDelete: (oldRow) => {
      if (oldRow.status === 'pending') callbacksRef.current.onMediaDelta(-1);
    },
  });

  useSupabaseRealtime<PostRow>({
    table: 'posts',
    filter: 'moderation_status=eq.pending',
    eventTypes: ['INSERT', 'UPDATE', 'DELETE'],
    onInsert: () => callbacksRef.current.onModDelta(1),
    onUpdate: (row, oldRow) => {
      const wasPending = oldRow.moderation_status === 'pending';
      const isPending = row.moderation_status === 'pending';
      if (!wasPending && isPending) callbacksRef.current.onModDelta(1);
      if (wasPending && !isPending) callbacksRef.current.onModDelta(-1);
    },
    onDelete: (oldRow) => {
      if (oldRow.moderation_status === 'pending') callbacksRef.current.onModDelta(-1);
    },
  });
}
