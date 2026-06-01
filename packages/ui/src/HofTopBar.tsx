import type { ReactNode } from 'react';
import { colors, fontFamilies } from '@hof/design-tokens';
import { Icon } from './Icon.js';

export interface HofTopBarProps {
  title?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  transparent?: boolean;
}

// Contextual top bar for inner pages: back arrow + title + optional action.
export function HofTopBar({ title, onBack, right, transparent = false }: HofTopBarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingTop: 54, // status bar
        background: transparent ? 'transparent' : 'rgba(20,20,18,0.92)',
        backdropFilter: transparent ? 'none' : 'blur(20px)',
        borderBottom: transparent ? 'none' : `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          className="hof-btn hof-press"
          onClick={onBack}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="arrowL" color={colors.text} size={22} />
        </button>
        <div
          style={{
            fontFamily: fontFamilies.body,
            fontWeight: 500,
            fontSize: 15,
            color: colors.text,
          }}
        >
          {title}
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {right}
        </div>
      </div>
    </div>
  );
}
