import { colors, fontFamilies } from '@hof/design-tokens';
import { REACTION_EMOJI, totalReactions } from './reactions';
import type { Post, ReactionKey } from './types';

export interface ReactionStripProps {
  post: Post;
  compact?: boolean;
}

// Stacked reaction emojis with a running total.
export function ReactionStrip({ post, compact = false }: ReactionStripProps) {
  const keys = Object.keys(post.reactions ?? {}) as ReactionKey[];
  if (keys.length === 0) {
    return (
      <span style={{ fontFamily: fontFamilies.body, fontSize: 11, color: colors.textSec }}>
        Be the first to react
      </span>
    );
  }
  const total = totalReactions(post);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        borderRadius: 16,
        background: post.myReaction ? 'rgba(232,101,26,0.12)' : colors.elevated,
        border: `1px solid ${post.myReaction ? 'rgba(232,101,26,0.35)' : colors.border}`,
      }}
    >
      <span style={{ display: 'inline-flex' }}>
        {keys.slice(0, 3).map((k, i) => (
          <span
            key={k}
            style={{ fontSize: compact ? 11 : 12, lineHeight: 1, marginLeft: i ? -4 : 0 }}
          >
            {REACTION_EMOJI[k]}
          </span>
        ))}
      </span>
      <span
        style={{
          fontFamily: fontFamilies.mono,
          fontSize: 11,
          color: colors.text,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 500,
        }}
      >
        {total}
      </span>
    </span>
  );
}
