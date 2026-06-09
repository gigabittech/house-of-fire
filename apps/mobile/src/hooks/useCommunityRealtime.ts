'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

type PostRow = {
  id: string;
  channel: string;
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
  onReactionChange,
  enabled = true,
}: {
  channel?: string;
  eventId?: string;
  onPostInsert?: (row: PostRow) => void;
  onPostUpdate?: (row: PostRow) => void;
  onReactionChange?: (postId: string, reactionCounts: Record<string, number>) => void;
  enabled?: boolean;
}) {
  const supabase = createClient();
  const callbacksRef = useRef({ onPostInsert, onPostUpdate, onReactionChange });

  useEffect(() => {
    callbacksRef.current = { onPostInsert, onPostUpdate, onReactionChange };
  }, [onPostInsert, onPostUpdate, onReactionChange]);

  const postFilter = channel ? `channel=eq.${channel}` : undefined;

  useSupabaseRealtime<PostRow>({
    supabase,
    table: 'posts',
    filter: postFilter,
    eventTypes: ['INSERT', 'UPDATE'],
    enabled: enabled && !!channel,
    onInsert: (row) => {
      if (row.moderation_status && row.moderation_status !== 'approved') return;
      if (eventId && row.event_id && row.event_id !== eventId) return;
      callbacksRef.current.onPostInsert?.(row);
    },
    onUpdate: (row) => {
      if (row.moderation_status === 'hidden' || row.moderation_status === 'rejected') return;
      callbacksRef.current.onPostUpdate?.(row);
      if (row.reaction_counts) {
        callbacksRef.current.onReactionChange?.(row.id, row.reaction_counts);
      }
    },
    onResync: () => {
      /* caller refetches via loadPosts */
    },
  });
}
