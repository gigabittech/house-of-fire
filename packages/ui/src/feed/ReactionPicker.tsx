import { colors, fontFamilies } from '@hof/design-tokens';
import { REACTION_EMOJI, REACTION_ORDER } from './reactions';
import type { ReactionKey } from './types';

export interface ReactionPickerProps {
  myReactions?: ReactionKey[];
  counts?: Partial<Record<ReactionKey, number>>;
  onToggle: (key: ReactionKey) => void;
  compact?: boolean;
}

export function ReactionPicker({
  myReactions = [],
  counts = {},
  onToggle,
  compact = false,
}: ReactionPickerProps) {
  const myReaction = myReactions[0] ?? null;

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {REACTION_ORDER.map((key) => {
        const active = myReaction === key;
        const count = counts[key] ?? 0;
        return (
          <button
            key={key}
            type="button"
            className="hof-btn hof-press"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(key);
            }}
            title={active ? 'Remove your reaction' : `React with ${REACTION_EMOJI[key]}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: compact ? '4px 8px' : '6px 10px',
              background: active ? 'rgba(232,101,26,0.14)' : colors.elevated,
              border: `1px solid ${active ? colors.amber : colors.border}`,
              borderRadius: 16,
              fontSize: compact ? 14 : 16,
              cursor: 'pointer',
              transition: 'transform 120ms ease, background 120ms ease',
            }}
          >
            <span style={{ lineHeight: 1 }}>{REACTION_EMOJI[key]}</span>
            {count > 0 && (
              <span
                style={{
                  fontFamily: fontFamilies.mono,
                  fontSize: 10,
                  fontWeight: 600,
                  color: active ? colors.amber : colors.textSec,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
