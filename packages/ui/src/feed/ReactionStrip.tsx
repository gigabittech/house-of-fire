import { colors, fontFamilies } from '@hof/design-tokens';
import { activeReactionEntries, REACTION_EMOJI } from './reactions';
import type { Post, ReactionKey } from './types';

export interface ReactionStripProps {
  post: Post;
  compact?: boolean;
  interactive?: boolean;
  myReactions?: ReactionKey[];
  onToggle?: (key: ReactionKey) => void;
  onOpenPicker?: () => void;
}

function resolveMyReaction(myReactions: ReactionKey[] | undefined, post: Post): ReactionKey | null {
  const fromProp = myReactions?.[0] ?? post.myReaction ?? null;
  return fromProp;
}

export function ReactionStrip({
  post,
  compact = false,
  interactive = false,
  myReactions,
  onToggle,
  onOpenPicker,
}: ReactionStripProps) {
  const myReaction = resolveMyReaction(myReactions, post);
  const entries = activeReactionEntries(post.reactions);
  const hasMine = myReaction !== null;

  if (entries.length === 0 && !interactive) {
    return (
      <span style={{ fontFamily: fontFamilies.body, fontSize: 11, color: colors.textSec }}>
        Be the first to react
      </span>
    );
  }

  const chipStyle = (key: ReactionKey) => {
    const isMine = myReaction === key;
    return {
      display: 'inline-flex' as const,
      alignItems: 'center' as const,
      gap: 4,
      padding: compact ? '3px 7px' : '4px 8px',
      borderRadius: 14,
      background: isMine ? 'rgba(232,101,26,0.14)' : colors.elevated,
      border: `1px solid ${isMine ? 'rgba(232,101,26,0.45)' : colors.border}`,
      fontFamily: fontFamilies.mono,
      fontSize: 11,
      fontWeight: 500,
      fontVariantNumeric: 'tabular-nums' as const,
      color: colors.text,
      lineHeight: 1,
    };
  };

  const chips = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
      {entries.map(({ key, count }) => (
        <span
          key={key}
          style={chipStyle(key)}
          title={myReaction === key ? 'Your reaction' : undefined}
        >
          <span style={{ fontSize: compact ? 11 : 12, lineHeight: 1 }}>{REACTION_EMOJI[key]}</span>
          <span>{count}</span>
        </span>
      ))}
      {entries.length === 0 && interactive && (
        <span style={{ fontFamily: fontFamilies.body, fontSize: 11, color: colors.textSec }}>
          React
        </span>
      )}
    </span>
  );

  const stripStyle = {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: 6,
    padding: entries.length > 0 ? '4px 6px' : '5px 10px',
    borderRadius: 16,
    background: hasMine && entries.length === 0 ? 'rgba(232,101,26,0.12)' : 'transparent',
    border:
      hasMine && entries.length === 0
        ? `1px solid rgba(232,101,26,0.35)`
        : entries.length > 0
          ? 'none'
          : `1px solid ${colors.border}`,
    cursor: interactive ? 'pointer' : undefined,
    transition: 'transform 120ms ease',
  };

  if (!interactive) {
    if (entries.length === 0) {
      return (
        <span style={{ fontFamily: fontFamilies.body, fontSize: 11, color: colors.textSec }}>
          Be the first to react
        </span>
      );
    }
    return <span style={stripStyle}>{chips}</span>;
  }

  return (
    <button
      type="button"
      className="hof-btn hof-press"
      onClick={(e) => {
        e.stopPropagation();
        if (onOpenPicker) {
          onOpenPicker();
        } else if (onToggle && entries.length > 0) {
          onToggle(entries[0]!.key);
        }
      }}
      style={{
        ...stripStyle,
        fontFamily: fontFamilies.body,
        fontSize: 11,
        color: colors.textSec,
      }}
    >
      {chips}
    </button>
  );
}
