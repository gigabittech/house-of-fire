import type { SupabaseClient } from '@supabase/supabase-js';
import type { FeedCursor } from './cursorPagination';
import { cursorFromRow } from './cursorPagination';
import type { ApiPost } from './postUi';

export async function fetchMyReactionsByPost(
  supabase: SupabaseClient,
  userId: string,
  postIds: string[],
): Promise<Record<string, string[]>> {
  if (postIds.length === 0) return {};

  const { data: reactions } = await supabase
    .from('post_reactions')
    .select('post_id, emoji')
    .eq('user_id', userId)
    .in('post_id', postIds);

  return (reactions ?? []).reduce<Record<string, string[]>>((acc, reaction) => {
    acc[reaction.post_id] = [reaction.emoji];
    return acc;
  }, {});
}

type RpcFeedResult = {
  posts: ApiPost[];
  hasMore: boolean;
};

export function buildFeedResponse(
  posts: ApiPost[],
  hasMore: boolean,
  myReactionsByPost?: Record<string, string[]>,
) {
  const nextCursor = hasMore ? cursorFromRow(posts[posts.length - 1]) : null;
  return {
    posts,
    hasMore,
    nextCursor,
    myReactionsByPost,
  };
}

export async function listCommunityPostsRpc(
  supabase: SupabaseClient,
  args: {
    channel: string | null;
    eventId: string | null;
    activeEventId: string | null;
    cursor: FeedCursor | null;
    pageSize: number;
  },
): Promise<RpcFeedResult> {
  const { data, error } = await supabase.rpc('list_community_posts', {
    p_channel: args.channel,
    p_event_id: args.eventId,
    p_active_event_id: args.eventId ? null : args.activeEventId,
    p_cursor_created_at: args.cursor?.createdAt ?? null,
    p_cursor_id: args.cursor?.id ?? null,
    p_page_size: args.pageSize,
  });

  if (error) throw error;

  const payload = (data ?? { posts: [], hasMore: false }) as RpcFeedResult;
  const posts = (payload.posts ?? []).filter((post) => post.moderation_status === 'approved');
  return {
    posts,
    hasMore: payload.hasMore ?? false,
  };
}

export async function listAuthorPostsRpc(
  supabase: SupabaseClient,
  authorId: string,
  cursor: FeedCursor | null,
  pageSize: number,
): Promise<RpcFeedResult> {
  const { data, error } = await supabase.rpc('list_author_posts', {
    p_author_id: authorId,
    p_cursor_created_at: cursor?.createdAt ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_page_size: pageSize,
  });

  if (error) throw error;

  const payload = (data ?? { posts: [], hasMore: false }) as RpcFeedResult;
  return {
    posts: payload.posts ?? [],
    hasMore: payload.hasMore ?? false,
  };
}

export type ApiReply = {
  id: string;
  author_id?: string;
  body: string;
  is_anonymous: boolean;
  created_at: string;
  profiles: {
    handle: string;
    display_name: string;
    role: string;
    avatar_url: string | null;
  } | null;
};

type RpcRepliesResult = {
  replies: ApiReply[];
  hasMore: boolean;
};

export async function listPostRepliesRpc(
  supabase: SupabaseClient,
  postId: string,
  cursor: FeedCursor | null,
  pageSize: number,
): Promise<RpcRepliesResult> {
  const { data, error } = await supabase.rpc('list_post_replies', {
    p_post_id: postId,
    p_cursor_created_at: cursor?.createdAt ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_page_size: pageSize,
  });

  if (error) throw error;

  const payload = (data ?? { replies: [], hasMore: false }) as RpcRepliesResult;
  return {
    replies: payload.replies ?? [],
    hasMore: payload.hasMore ?? false,
  };
}

export function buildRepliesResponse(replies: ApiReply[], hasMore: boolean) {
  const nextCursor = hasMore ? cursorFromRow(replies[replies.length - 1]) : null;
  return { replies, hasMore, nextCursor };
}
