import type { CSSProperties } from 'react';
import { colors, fontFamilies } from '@hof/design-tokens';

export interface ChannelTagProps {
  id: string;
  style?: CSSProperties;
}

export function ChannelTag({ id, style = {} }: ChannelTagProps) {
  return (
    <span
      style={{
        fontFamily: fontFamilies.mono,
        fontSize: 11,
        color: colors.amber,
        letterSpacing: '0.02em',
        ...style,
      }}
    >
      #{id}
    </span>
  );
}
