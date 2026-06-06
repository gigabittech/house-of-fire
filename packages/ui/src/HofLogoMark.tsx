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
  /** Sidebar wordmark — no glow or negative crop margins (avoids seam under logo). */
  variant?: 'default' | 'sidebar';
}

// Small emblem for nav. Image src is app-supplied so the library stays
// decoupled from asset locations.
export function HofLogoMark({
  size = 90,
  fit = 'mark',
  width = '100%',
  src = '/assets/hof-emblem.png',
  alt = '',
  variant = 'default',
}: HofLogoMarkProps) {
  if (fit === 'wordmark') {
    const sidebar = variant === 'sidebar';
    return (
      <img
        src={src}
        alt={alt}
        style={{
          width,
          height: 'auto',
          display: 'block',
          marginTop: sidebar ? 0 : -16,
          marginBottom: sidebar ? 0 : -16,
          filter: sidebar ? undefined : shadows.logoGlow,
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
