import type { Post, ReactionKey } from './types';

export const REACTION_EMOJI: Record<ReactionKey, string> = {
  fire: '🔥',
  heart: '❤️',
  pray: '🙏',
  music: '🎶',
  eyes: '👀',
};

export function totalReactions(post: Post): number {
  return Object.values(post.reactions ?? {}).reduce((sum, v) => sum + (v ?? 0), 0);
}
