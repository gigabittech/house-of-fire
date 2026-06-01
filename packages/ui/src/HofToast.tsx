import type { ReactNode } from 'react';
import { colors, fontFamilies } from '@hof/design-tokens';
import { Icon } from './Icon.js';
import type { IconName } from './Icon.js';

export type ToastKind = 'success' | 'info' | 'warn' | 'error';

export interface HofToastProps {
  kind?: ToastKind;
  children: ReactNode;
  onDismiss?: () => void;
}

interface ToastConfig {
  bg: string;
  border: string;
  icon: IconName;
  color: string;
}

const toastConfig: Record<ToastKind, ToastConfig> = {
  success: {
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.3)',
    icon: 'bolt',
    color: colors.success,
  },
  info: {
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.3)',
    icon: 'bell',
    color: colors.info,
  },
  warn: {
    bg: 'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.3)',
    icon: 'bolt',
    color: colors.warning,
  },
  error: {
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    icon: 'bolt',
    color: colors.error,
  },
};

export function HofToast({ kind = 'success', children, onDismiss }: HofToastProps) {
  const config: ToastConfig = toastConfig[kind];

  return (
    <div
      style={{
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <Icon name={config.icon} size={16} color={config.color} />
      <span
        style={{
          flex: 1,
          fontFamily: fontFamilies.body,
          fontSize: 13,
          color: colors.text,
          lineHeight: 1.4,
        }}
      >
        {children}
      </span>
      {onDismiss !== undefined && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            fontFamily: fontFamilies.body,
            fontSize: 16,
            color: colors.textSec,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
