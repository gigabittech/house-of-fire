'use client';

import { useCallback, useRef, useState } from 'react';
import {
  appendCursorParams,
  type FeedCursor,
  mergeUniqueById,
  prependUniqueById,
} from '@/lib/cursorPagination';
import type { ApiPost } from '@/lib/postUi';

const DEFAULT_PAGE_SIZE = 20;

type FeedMode =
  | { kind: 'channel'; channel: string }
  | { kind: 'mine' };

type FeedPageResponse = {
  posts?: ApiPost[];
  myReactionsByPost?: Record<string, string[]>;
  nextCursor?: FeedCursor | null;
  hasMore?: boolean;
};

function buildFeedUrl(mode: FeedMode, cursor: FeedCursor | null, pageSize: number): string {
  const url = new URL(
    mode.kind === 'mine' ? '/api/profile/posts' : '/api/posts',
    window.location.origin,
  );

  if (mode.kind === 'channel') {
    url.searchParams.set('channel', mode.channel);
    url.searchParams.set('includeMyReactions', '1');
  }

  url.searchParams.set('limit', String(pageSize));
  appendCursorParams(url, cursor);
  return `${url.pathname}${url.search}`;
}

export function useCommunityFeed(mode: FeedMode, pageSize = DEFAULT_PAGE_SIZE) {
  const modeKind = mode.kind;
  const channel = mode.kind === 'channel' ? mode.channel : '';

  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [myReactionsByPost, setMyReactionsByPost] = useState<Record<string, string[]>>({});
  const [nextCursor, setNextCursor] = useState<FeedCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const applyPage = useCallback(
    (data: FeedPageResponse, append: boolean) => {
      const incoming = data.posts ?? [];
      setPosts((prev) => (append ? mergeUniqueById(prev, incoming) : incoming));
      setNextCursor(data.nextCursor ?? null);
      setHasMore(data.hasMore ?? false);

      if (modeKind === 'channel' && data.myReactionsByPost) {
        setMyReactionsByPost((prev) =>
          append ? { ...prev, ...data.myReactionsByPost } : (data.myReactionsByPost ?? {}),
        );
      } else if (!append) {
        setMyReactionsByPost({});
      }
    },
    [modeKind],
  );

  const fetchPage = useCallback(
    async (cursor: FeedCursor | null, append: boolean) => {
      const requestId = ++requestIdRef.current;
      const feedMode: FeedMode =
        modeKind === 'mine' ? { kind: 'mine' } : { kind: 'channel', channel };
      const response = await fetch(buildFeedUrl(feedMode, cursor, pageSize));
      if (!response.ok) throw new Error('feed fetch failed');
      const data = (await response.json()) as FeedPageResponse;
      if (requestId !== requestIdRef.current) return;
      applyPage(data, append);
    },
    [applyPage, channel, modeKind, pageSize],
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

  const prependPost = useCallback((post: ApiPost) => {
    setPosts((prev) => prependUniqueById(prev, post));
  }, []);

  const patchPost = useCallback(
    (row: {
      id: string;
      reaction_counts?: Record<string, number>;
      reply_count?: number;
      moderation_status?: ApiPost['moderation_status'];
    }) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === row.id
            ? {
                ...post,
                reaction_counts: row.reaction_counts ?? post.reaction_counts,
                reply_count: row.reply_count ?? post.reply_count,
                moderation_status: row.moderation_status ?? post.moderation_status,
              }
            : post,
        ),
      );
    },
    [],
  );

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  const prependMinePost = useCallback((post: ApiPost) => {
    setPosts((prev) => prependUniqueById(prev, post));
  }, []);

  return {
    posts,
    myReactionsByPost,
    setMyReactionsByPost,
    hasMore,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    prependPost,
    patchPost,
    removePost,
    prependMinePost,
  };
}
