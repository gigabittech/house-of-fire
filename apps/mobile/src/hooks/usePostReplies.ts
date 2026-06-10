'use client';

import { useCallback, useRef, useState } from 'react';
import { appendCursorParams, type FeedCursor, mergeUniqueById } from '@/lib/cursorPagination';
import type { ApiReply } from '@/lib/communityApi.server';

const DEFAULT_REPLY_PAGE_SIZE = 30;

type RepliesPageResponse = {
  replies?: ApiReply[];
  nextCursor?: FeedCursor | null;
  hasMore?: boolean;
};

function buildRepliesUrl(postId: string, cursor: FeedCursor | null, pageSize: number): string {
  const url = new URL(`/api/posts/${postId}/replies`, window.location.origin);
  url.searchParams.set('limit', String(pageSize));
  appendCursorParams(url, cursor);
  return `${url.pathname}${url.search}`;
}

export function usePostReplies(postId: string, pageSize = DEFAULT_REPLY_PAGE_SIZE) {
  const [replies, setReplies] = useState<ApiReply[]>([]);
  const [nextCursor, setNextCursor] = useState<FeedCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const applyPage = useCallback((data: RepliesPageResponse, append: boolean) => {
    const incoming = data.replies ?? [];
    setReplies((prev) => (append ? mergeUniqueById(prev, incoming) : incoming));
    setNextCursor(data.nextCursor ?? null);
    setHasMore(data.hasMore ?? false);
  }, []);

  const fetchPage = useCallback(
    async (cursor: FeedCursor | null, append: boolean) => {
      const requestId = ++requestIdRef.current;
      const response = await fetch(buildRepliesUrl(postId, cursor, pageSize));
      if (!response.ok) throw new Error('replies fetch failed');
      const data = (await response.json()) as RepliesPageResponse;
      if (requestId !== requestIdRef.current) return;
      applyPage(data, append);
    },
    [applyPage, pageSize, postId],
  );

  const refresh = useCallback(async () => {
    if (!postId) return;
    setError(false);
    setLoading(true);
    loadingMoreRef.current = false;
    setLoadingMore(false);
    try {
      await fetchPage(null, false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchPage, postId]);

  const loadMore = useCallback(async () => {
    if (!postId || !hasMore || !nextCursor || loading || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(false);
    try {
      await fetchPage(nextCursor, true);
    } catch {
      setError(true);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading, nextCursor, postId]);

  const appendReply = useCallback((reply: ApiReply) => {
    setReplies((prev) => mergeUniqueById(prev, [reply]));
  }, []);

  const replaceReply = useCallback((tempId: string, reply: ApiReply) => {
    setReplies((prev) => prev.map((row) => (row.id === tempId ? reply : row)));
  }, []);

  const removeReply = useCallback((replyId: string) => {
    setReplies((prev) => prev.filter((row) => row.id !== replyId));
  }, []);

  return {
    replies,
    hasMore,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    appendReply,
    replaceReply,
    removeReply,
  };
}
