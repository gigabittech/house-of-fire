import { shadows } from '@hof/design-tokens';

export interface HofLogoMarkProps {
  size?: number;
  /** Resolved URL for the emblem (app supplies, e.g. /assets/hof-emblem.png). */
  src?: string;
  alt?: string;
}

// Small emblem for nav. Image src is app-supplied so the library stays
// decoupled from asset locations.
export function HofLogoMark({
  size = 28,
  src = '/assets/hof-emblem.png',
  alt = '',
}: HofLogoMarkProps) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size,
        height: size,
        display: 'block',
        filter: shadows.logoGlow,
      }}
    />
  );
}
