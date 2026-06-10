'use client';

import { appendPhotoCursorParams, mergePhotosById, type EventPhotoCursor, type EventPhotoRow } from '@hof/media';
import { useCallback, useRef, useState } from 'react';

const DEFAULT_PAGE_SIZE = 48;

type PhotoPageResponse = {
  photos?: EventPhotoRow[];
  nextCursor?: EventPhotoCursor | null;
  hasMore?: boolean;
  totalCount?: number;
  event?: unknown;
};

function buildGalleryUrl(basePath: string, cursor: EventPhotoCursor | null, pageSize: number): string {
  const url = new URL(basePath, window.location.origin);
  url.searchParams.set('limit', String(pageSize));
  appendPhotoCursorParams(url, cursor);
  return `${url.pathname}${url.search}`;
}

export function useEventPhotoGallery<TEvent = unknown>(basePath: string, pageSize = DEFAULT_PAGE_SIZE) {
  const [photos, setPhotos] = useState<EventPhotoRow[]>([]);
  const [eventMeta, setEventMeta] = useState<TEvent | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [nextCursor, setNextCursor] = useState<EventPhotoCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const applyPage = useCallback((data: PhotoPageResponse, append: boolean) => {
    const incoming = data.photos ?? [];
    setPhotos((prev) => (append ? mergePhotosById(prev, incoming) : incoming));
    setNextCursor(data.nextCursor ?? null);
    setHasMore(data.hasMore ?? false);
    if (!append && data.event) {
      setEventMeta(data.event as TEvent);
    }
    if (typeof data.totalCount === 'number') {
      setTotalCount(data.totalCount);
    }
  }, []);

  const fetchPage = useCallback(
    async (cursor: EventPhotoCursor | null, append: boolean) => {
      const requestId = ++requestIdRef.current;
      const response = await fetch(buildGalleryUrl(basePath, cursor, pageSize));
      if (!response.ok) throw new Error('photo fetch failed');
      const data = (await response.json()) as PhotoPageResponse;
      if (requestId !== requestIdRef.current) return data;
      applyPage(data, append);
      return data;
    },
    [applyPage, basePath, pageSize],
  );

  const refresh = useCallback(async () => {
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
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loading || loadingMoreRef.current) return;
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
  }, [fetchPage, hasMore, loading, nextCursor]);

  return {
    photos,
    eventMeta,
    totalCount,
    hasMore,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
  };
}
