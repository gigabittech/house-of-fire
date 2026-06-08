import { colors } from '@hof/design-tokens';
import { REACTION_EMOJI } from './reactions';
import type { ReactionKey } from './types';

export interface ReactionPickerProps {
  myReactions?: ReactionKey[];
  onToggle: (key: ReactionKey) => void;
  compact?: boolean;
}

const REACTION_KEYS: ReactionKey[] = ['fire', 'heart', 'music', 'eyes', 'pray'];

export function ReactionPicker({ myReactions = [], onToggle, compact = false }: ReactionPickerProps) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {REACTION_KEYS.map((key) => {
        const active = myReactions.includes(key);
        return (
          <button
            key={key}
            type="button"
            className="hof-btn hof-press"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(key);
            }}
            style={{
              padding: compact ? '4px 8px' : '6px 10px',
              background: active ? 'rgba(232,101,26,0.14)' : colors.elevated,
              border: `1px solid ${active ? colors.amber : colors.border}`,
              borderRadius: 16,
              fontSize: compact ? 14 : 16,
              cursor: 'pointer',
              transition: 'transform 120ms ease, background 120ms ease',
            }}
          >
            {REACTION_EMOJI[key]}
          </button>
        );
      })}
    </div>
  );
}
