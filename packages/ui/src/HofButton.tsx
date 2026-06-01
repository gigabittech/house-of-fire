import type { CSSProperties, ReactNode } from 'react';
import { colors, fontFamilies } from '@hof/design-tokens';

export type ButtonVariant = 'primary' | 'ghost' | 'gold' | 'danger' | 'quiet';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface HofButtonProps {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  full?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  'aria-label'?: string;
}

const variants: Record<ButtonVariant, CSSProperties> = {
  primary: { background: colors.amber, color: colors.bg, boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
  ghost: { background: 'transparent', color: colors.text, border: `1px solid ${colors.border}` },
  gold: { background: 'linear-gradient(180deg, #d9a838 0%, #C9942A 100%)', color: colors.bg },
  danger: { background: colors.ember, color: colors.text },
  quiet: { background: colors.elevated, color: colors.text },
};

const sizes: Record<ButtonSize, CSSProperties> = {
  lg: { height: 52, padding: '0 22px', fontSize: 15, borderRadius: 10 },
  md: { height: 44, padding: '0 18px', fontSize: 14, borderRadius: 8 },
  sm: { height: 34, padding: '0 12px', fontSize: 13, borderRadius: 8 },
};

export function HofButton({
  children,
  variant = 'primary',
  size = 'lg',
  icon,
  onClick,
  style = {},
  full = false,
  disabled = false,
  type = 'button',
  'aria-label': ariaLabel,
}: HofButtonProps) {
  return (
    <button
      type={type}
      className="hof-btn hof-press"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        ...sizes[size],
        ...variants[variant],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: fontFamilies.body,
        fontWeight: 500,
        letterSpacing: 0.1,
        width: full ? '100%' : 'auto',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}
