import { colors } from '@hof/design-tokens';
import type { CSSProperties } from 'react';

export interface HofSkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: CSSProperties;
}

export function HofSkeleton({ width = '100%', height = 14, radius = 4, style }: HofSkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${colors.surface} 0%, ${colors.elevated} 50%, ${colors.surface} 100%)`,
        backgroundSize: '200% 100%',
        animation: 'hof-shimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  );
}
