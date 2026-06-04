import { shadows } from '@hof/design-tokens';

export interface HofLogoMarkProps {
  size?: number;
  /** `mark` = square crop (nav chrome). `wordmark` = full logo, scales to `width`. */
  fit?: 'mark' | 'wordmark';
  /** Used when `fit="wordmark"` (default `100%`). */
  width?: number | string;
  /** Resolved URL for the emblem (app supplies, e.g. /assets/hof-emblem.png). */
  src?: string;
  alt?: string;
}

// Small emblem for nav. Image src is app-supplied so the library stays
// decoupled from asset locations.
export function HofLogoMark({
  size = 90,
  fit = 'mark',
  width = '100%',
  src = '/assets/hof-emblem.png',
  alt = '',
}: HofLogoMarkProps) {
  if (fit === 'wordmark') {
    return (
      <img
        src={src}
        alt={alt}
        style={{
          width,
          height: 'auto',
          display: 'block',
          marginTop: -16,
          marginBottom: -16,
          filter: shadows.logoGlow,
        }}
      />
    );
  }

  // Source PNG is the full wordmark (icon + text + vertical padding). Clip to a
  // square from the left so only the diamond mark shows in compact nav chrome.
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          height: size,
          width: 'auto',
          display: 'block',
          filter: shadows.logoGlow,
        }}
      />
    </span>
  );
}
