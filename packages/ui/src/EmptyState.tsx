import { colors, fontFamilies } from '@hof/design-tokens';
import type { ReactNode } from 'react';
import type { IconName } from './Icon';
import { Icon } from './Icon';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
  secondary?: ReactNode;
}

export function EmptyState({ icon = 'flame', title, body, action, secondary }: EmptyStateProps) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          margin: '0 auto 16px',
          background: 'rgba(232,101,26,0.10)',
          border: '1px solid rgba(232,101,26,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={26} color={colors.amber} />
      </div>
      <div
        style={{
          fontFamily: fontFamilies.display,
          fontWeight: 600,
          fontSize: 22,
          color: colors.text,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      {body !== undefined && (
        <div
          style={{
            fontFamily: fontFamilies.body,
            fontSize: 13,
            color: colors.textSec,
            marginTop: 8,
            lineHeight: 1.55,
            maxWidth: 280,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {body}
        </div>
      )}
      {action !== undefined && <div style={{ marginTop: 18 }}>{action}</div>}
      {secondary !== undefined && <div style={{ marginTop: 10 }}>{secondary}</div>}
    </div>
  );
}
