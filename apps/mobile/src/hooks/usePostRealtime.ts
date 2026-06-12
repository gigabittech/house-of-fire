'use client';

import { useSupabaseRealtime } from '@hof/realtime';
import { useEffect, useRef } from 'react';
import type { ApiReply } from '@/lib/communityApi.server';

type PostRow = {
  id: string;
  reaction_counts?: Record<string, number>;
  reply_count?: number;
  moderation_status?: string;
};

export function usePostRealtime({
  postId,
  onPostUpdate,
  onReplyInsert,
  enabled = true,
}: {
  postId: string;
  onPostUpdate?: (row: PostRow) => void;
  onReplyInsert?: (row: ApiReply) => void;
  enabled?: boolean;
}) {
  const callbacksRef = useRef({ onPostUpdate, onReplyInsert });

  useEffect(() => {
    callbacksRef.current = { onPostUpdate, onReplyInsert };
  }, [onPostUpdate, onReplyInsert]);

  useSupabaseRealtime<PostRow>({
    table: 'posts',
    filter: `id=eq.${postId}`,
    eventTypes: ['UPDATE'],
    enabled: enabled && !!postId,
    onUpdate: (row) => callbacksRef.current.onPostUpdate?.(row),
  });

  useSupabaseRealtime<ApiReply>({
    table: 'replies',
    filter: `post_id=eq.${postId}`,
    eventTypes: ['INSERT'],
    enabled: enabled && !!postId,
    onInsert: (row) => callbacksRef.current.onReplyInsert?.(row),
  });
}
