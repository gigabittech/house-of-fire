'use client';

import { type RefObject, useEffect, useRef } from 'react';

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  rootRef,
  rootMargin = '240px',
}: {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  rootRef?: RefObject<Element | null>;
  rootMargin?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      {
        root: rootRef?.current ?? null,
        rootMargin,
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, rootMargin, rootRef]);

  return sentinelRef;
}
