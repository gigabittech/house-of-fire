import type { CSSProperties, ReactNode } from 'react';
import { colors, fontFamilies } from '@hof/design-tokens';

export interface HofPhotoProps {
  /** Resolved image URL (app supplies from its photo library). */
  src: string;
  caption?: string;
  /** Small uppercase mono label rendered top-left. */
  label?: string;
  style?: CSSProperties;
  gradient?: boolean;
  objectPosition?: string;
  children?: ReactNode;
}

// Real event photo with an optional darkening gradient. The src is explicit
// (the prototype indexed a global photo array; the app now owns that list).
export function HofPhoto({
  src,
  caption,
  label,
  style = {},
  gradient = true,
  objectPosition = 'center',
  children,
}: HofPhotoProps) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: colors.bg, ...style }}>
      <img
        src={src}
        alt={caption ?? ''}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition,
        }}
      />
      {gradient && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,10,8,0.0) 50%, rgba(10,10,8,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}
      {label && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            zIndex: 2,
            fontFamily: fontFamilies.mono,
            fontSize: 9,
            color: 'rgba(240,237,230,0.7)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
