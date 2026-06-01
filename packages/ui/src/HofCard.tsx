import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { colors } from '@hof/design-tokens';

export interface HofCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Inner padding in px (or any CSS padding value). */
  padded?: number | string;
  style?: CSSProperties;
}

export function HofCard({ children, padded = 16, style = {}, ...rest }: HofCardProps) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: padded,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
