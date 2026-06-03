import { colors, fontFamilies } from '@hof/design-tokens';
import type { CSSProperties, ReactNode } from 'react';

export type PillTone = 'neutral' | 'amber' | 'gold' | 'danger' | 'warning' | 'success' | 'crew';
export type PillSize = 'sm' | 'md';

export interface HofPillProps {
  children?: ReactNode;
  tone?: PillTone;
  size?: PillSize;
  icon?: ReactNode;
  style?: CSSProperties;
}

interface ToneSpec {
  bg: string;
  fg: string;
  br: string;
}

const tones: Record<PillTone, ToneSpec> = {
  neutral: { bg: colors.elevated, fg: colors.textSec, br: 'transparent' },
  amber: { bg: 'rgba(232,101,26,0.16)', fg: colors.glow, br: 'rgba(232,101,26,0.3)' },
  gold: { bg: 'rgba(201,148,42,0.12)', fg: colors.gold, br: 'rgba(201,148,42,0.35)' },
  danger: { bg: colors.ember, fg: colors.text, br: 'transparent' },
  warning: { bg: colors.warning, fg: colors.bg, br: 'transparent' },
  success: { bg: 'rgba(76,175,110,0.12)', fg: colors.success, br: 'rgba(76,175,110,0.3)' },
  crew: { bg: colors.amber, fg: colors.bg, br: 'transparent' },
};

export function HofPill({
  children,
  tone = 'neutral',
  size = 'md',
  icon,
  style = {},
}: HofPillProps) {
  const t = tones[tone];
  const sz: CSSProperties =
    size === 'sm'
      ? { height: 20, padding: '0 8px', fontSize: 10 }
      : { height: 24, padding: '0 10px', fontSize: 11 };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.br}`,
        borderRadius: 4,
        fontFamily: fontFamilies.body,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        ...sz,
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  );
}
