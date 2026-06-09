import type { Post, ReactionKey } from './types';

export const REACTION_EMOJI: Record<ReactionKey, string> = {
  fire: '🔥',
  heart: '❤️',
  pray: '🙏',
  music: '🎶',
  eyes: '👀',
};

export const REACTION_ORDER: ReactionKey[] = ['fire', 'heart', 'music', 'eyes', 'pray'];

export function totalReactions(post: Post): number {
  return Object.values(post.reactions ?? {}).reduce((sum, v) => sum + (v ?? 0), 0);
}

export function activeReactionEntries(
  reactions: Post['reactions'],
): { key: ReactionKey; count: number }[] {
  return REACTION_ORDER.map((key) => ({
    key,
    count: reactions?.[key] ?? 0,
  })).filter((entry) => entry.count > 0);
}
