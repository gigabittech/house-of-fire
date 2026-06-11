'use client';

import { colors } from '@hof/design-tokens';
import { hofChromeCircleBtn, Icon, type IconName } from '@hof/ui';
import type { ReactNode } from 'react';

export function AppHeaderBackButton({
  onClick,
  label = 'Back',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="hof-btn hof-press"
      onClick={onClick}
      aria-label={label}
      style={hofChromeCircleBtn}
    >
      <Icon name="chev" size={16} color={colors.text} style={{ transform: 'rotate(180deg)' }} />
    </button>
  );
}

export function AppHeaderIconButton({
  icon,
  onClick,
  label,
  badge,
}: {
  icon: IconName;
  onClick: () => void;
  label: string;
  badge?: ReactNode;
}) {
  return (
    <button
      type="button"
      className="hof-btn hof-press"
      onClick={onClick}
      aria-label={label}
      style={{ ...hofChromeCircleBtn, position: 'relative' }}
    >
      <Icon name={icon} size={16} color={colors.text} />
      {badge}
    </button>
  );
}
