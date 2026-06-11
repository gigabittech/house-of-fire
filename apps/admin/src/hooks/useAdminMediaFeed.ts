'use client';

import { appendPhotoCursorParams, mergePhotosById, type EventPhotoCursor } from '@hof/media';
import { useCallback, useRef, useState } from 'react';

type MediaPageResponse<T> = {
  photos?: T[];
  nextCursor?: EventPhotoCursor | null;
  hasMore?: boolean;
  totalCount?: number;
  error?: string;
};

function buildMediaUrl(queryString: string, cursor: EventPhotoCursor | null): string {
  const url = new URL(`/api/admin/media?${queryString}`, window.location.origin);
  appendPhotoCursorParams(url, cursor);
  return `${url.pathname}${url.search}`;
}

export function useAdminMediaFeed<TApi extends { id: string }, TItem extends { id: string }>(
  queryString: string,
  mapItem: (row: TApi) => TItem,
) {
  const [photos, setPhotos] = useState<TItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<EventPhotoCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const applyPage = useCallback(
    (data: MediaPageResponse<TApi>, append: boolean) => {
      const incoming = (data.photos ?? []).map(mapItem);
      setPhotos((prev) => (append ? mergePhotosById(prev, incoming) : incoming));
      setNextCursor(data.nextCursor ?? null);
      setHasMore(data.hasMore ?? false);
      if (typeof data.totalCount === 'number') {
        setTotalCount(data.totalCount);
      }
    },
    [mapItem],
  );

  const fetchPage = useCallback(
    async (cursor: EventPhotoCursor | null, append: boolean) => {
      const requestId = ++requestIdRef.current;
      const response = await fetch(buildMediaUrl(queryString, cursor));
      const data = (await response.json()) as MediaPageResponse<TApi>;
      if (requestId !== requestIdRef.current) return;
      if (data.error) throw new Error(data.error);
      applyPage(data, append);
    },
    [applyPage, queryString],
  );

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    loadingMoreRef.current = false;
    setLoadingMore(false);
    try {
      await fetchPage(null, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loading || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await fetchPage(nextCursor, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more photos');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading, nextCursor]);

  return {
    photos,
    setPhotos,
    totalCount,
    hasMore,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
  };
}
