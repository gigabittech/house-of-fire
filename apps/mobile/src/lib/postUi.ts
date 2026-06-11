import type { Post as UiPost, ReactionKey } from '@hof/ui';
import { parseMediaUrls } from './postMedia';

export type ApiPost = {
  id: string;
  channel: string;
  title: string;
  body: string | null;
  is_anonymous: boolean;
  is_pinned?: boolean;
  reply_count: number;
  reaction_counts: Record<string, number>;
  media_urls?: unknown;
  moderation_status?: 'pending' | 'approved' | 'rejected' | 'hidden' | 'draft';
  moderation_note?: string | null;
  created_at: string;
  profiles: {
    handle: string;
    display_name: string;
    role: string;
    avatar_url: string | null;
  } | null;
};

export function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const VALID_REACTIONS = new Set<string>(['fire', 'heart', 'pray', 'music', 'eyes']);

export function parseReactions(
  counts: Record<string, number>,
): Partial<Record<ReactionKey, number>> {
  const reactions: Partial<Record<ReactionKey, number>> = {};
  for (const [k, v] of Object.entries(counts)) {
    if (VALID_REACTIONS.has(k)) {
      (reactions as Record<string, number>)[k] = v;
    }
  }
  return reactions;
}

export interface ApiPostToUiOptions {
  myReactions?: string[];
}

export function apiPostToUi(p: ApiPost, options: ApiPostToUiOptions = {}): UiPost {
  const { myReactions = [] } = options;
  const displayName = p.is_anonymous
    ? 'Anonymous'
    : (p.profiles?.display_name ?? p.profiles?.handle ?? 'Member');
  const initials =
    displayName
      .split(' ')
      .map((w) => w[0] ?? '')
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  const role = (p.profiles?.role === 'crew' ? 'crew' : 'member') as 'crew' | 'member';
  const reactions = parseReactions(p.reaction_counts);
  const myReaction = (myReactions[0] ?? null) as ReactionKey | null;

  return {
    id: p.id,
    channel: p.channel,
    kind: 'quick',
    author: {
      name: displayName,
      initials,
      role,
      avatarUrl: p.is_anonymous ? undefined : (p.profiles?.avatar_url ?? undefined),
    },
    time: timeAgo(p.created_at),
    title: p.title || undefined,
    body: p.body ?? undefined,
    imageUrls: parseMediaUrls(p.media_urls),
    reactions,
    myReactions: myReactions.length > 0 ? (myReactions as ReactionKey[]) : undefined,
    myReaction,
    replyCount: p.reply_count,
    pinned: p.is_pinned,
    moderationStatus: p.moderation_status,
    moderationNote: p.moderation_note ?? undefined,
  };
}
