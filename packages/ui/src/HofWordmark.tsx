import type { CSSProperties } from 'react';

export interface HofWordmarkProps {
  height?: number;
  /** Resolved URL for the wordmark (app supplies, e.g. /assets/hof-logo.png). */
  src?: string;
  style?: CSSProperties;
  alt?: string;
}

export function HofWordmark({
  height = 56,
  src = '/assets/hof-logo.png',
  style = {},
  alt = 'House of Fire',
}: HofWordmarkProps) {
  return <img src={src} alt={alt} style={{ height, width: 'auto', display: 'block', ...style }} />;
}
