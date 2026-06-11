'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';

type PostRow = {
  id: string;
  channel: string;
  event_id?: string | null;
  moderation_status?: string;
  reaction_counts?: Record<string, number>;
  reply_count?: number;
  [key: string]: unknown;
};

export function useCommunityRealtime({
  channel,
  eventId,
  onPostInsert,
  onPostUpdate,
  onPostDelete,
  onReactionChange,
  onResync,
  enabled = true,
}: {
  channel?: string;
  eventId?: string;
  onPostInsert?: (row: PostRow) => void;
  onPostUpdate?: (row: PostRow) => void;
  onPostDelete?: (row: Partial<PostRow>) => void;
  onReactionChange?: (postId: string, reactionCounts: Record<string, number>) => void;
  onResync?: () => void;
  enabled?: boolean;
}) {
  const callbacksRef = useRef({
    onPostInsert,
    onPostUpdate,
    onPostDelete,
    onReactionChange,
    onResync,
  });

  useEffect(() => {
    callbacksRef.current = {
      onPostInsert,
      onPostUpdate,
      onPostDelete,
      onReactionChange,
      onResync,
    };
  }, [onPostInsert, onPostUpdate, onPostDelete, onReactionChange, onResync]);

  const postFilter = channel ? `channel=eq.${channel}` : undefined;

  useSupabaseRealtime<PostRow>({
    table: 'posts',
    filter: postFilter,
    eventTypes: ['INSERT', 'UPDATE', 'DELETE'],
    enabled: enabled && !!channel,
    onInsert: (row) => {
      if (row.moderation_status && row.moderation_status !== 'approved') return;
      if (eventId && row.event_id && row.event_id !== eventId) return;
      callbacksRef.current.onPostInsert?.(row);
    },
    onUpdate: (row) => {
      if (row.moderation_status === 'hidden' || row.moderation_status === 'rejected') {
        callbacksRef.current.onPostDelete?.({ id: row.id });
        return;
      }
      callbacksRef.current.onPostUpdate?.(row);
      if (row.reaction_counts) {
        callbacksRef.current.onReactionChange?.(row.id, row.reaction_counts);
      }
    },
    onDelete: (oldRow) => {
      if (oldRow.id) callbacksRef.current.onPostDelete?.(oldRow);
    },
    onResync: () => callbacksRef.current.onResync?.(),
  });
}
