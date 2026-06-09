import { colors, fontFamilies } from '@hof/design-tokens';
import { REACTION_EMOJI, totalReactions } from './reactions';
import type { Post, ReactionKey } from './types';

export interface ReactionStripProps {
  post: Post;
  compact?: boolean;
  interactive?: boolean;
  myReactions?: ReactionKey[];
  onToggle?: (key: ReactionKey) => void;
  onOpenPicker?: () => void;
}

export function ReactionStrip({
  post,
  compact = false,
  interactive = false,
  myReactions,
  onToggle,
  onOpenPicker,
}: ReactionStripProps) {
  const activeReactions = myReactions ?? post.myReactions ?? (post.myReaction ? [post.myReaction] : []);
  const keys = Object.keys(post.reactions ?? {}) as ReactionKey[];
  const hasMine = activeReactions.length > 0;

  if (keys.length === 0 && !interactive) {
    return (
      <span style={{ fontFamily: fontFamilies.body, fontSize: 11, color: colors.textSec }}>
        Be the first to react
      </span>
    );
  }

  const total = totalReactions(post);

  const inner = (
    <>
      <span style={{ display: 'inline-flex' }}>
        {(keys.length > 0 ? keys : activeReactions).slice(0, 3).map((k, i) => (
          <span
            key={k}
            style={{ fontSize: compact ? 11 : 12, lineHeight: 1, marginLeft: i ? -4 : 0 }}
          >
            {REACTION_EMOJI[k]}
          </span>
        ))}
        {keys.length === 0 && interactive && (
          <span style={{ fontSize: compact ? 11 : 12, lineHeight: 1 }}>+</span>
        )}
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
        {total > 0 ? total : interactive ? 'React' : 0}
      </span>
    </>
  );

  const stripStyle = {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: 6,
    padding: '5px 10px',
    borderRadius: 16,
    background: hasMine ? 'rgba(232,101,26,0.12)' : colors.elevated,
    border: `1px solid ${hasMine ? 'rgba(232,101,26,0.35)' : colors.border}`,
    cursor: interactive ? 'pointer' : undefined,
    transition: 'transform 120ms ease',
  };

  if (!interactive) {
    if (keys.length === 0) {
      return (
        <span style={{ fontFamily: fontFamilies.body, fontSize: 11, color: colors.textSec }}>
          Be the first to react
        </span>
      );
    }
    return <span style={stripStyle}>{inner}</span>;
  }

  return (
    <button
      type="button"
      className="hof-btn hof-press"
      onClick={(e) => {
        e.stopPropagation();
        if (onOpenPicker) {
          onOpenPicker();
        } else if (onToggle && keys.length > 0) {
          onToggle(keys[0]!);
        }
      }}
      style={{
        ...stripStyle,
        fontFamily: fontFamilies.body,
        fontSize: 11,
        color: colors.textSec,
      }}
    >
      {inner}
    </button>
  );
}
