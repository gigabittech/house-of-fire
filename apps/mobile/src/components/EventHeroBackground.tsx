'use client';

import { useResponsive } from '@hof/ui';
import type { CSSProperties, ReactNode } from 'react';

const HERO_IMAGE_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center 30%',
};

const WARM_VIGNETTE_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'radial-gradient(ellipse at 50% 40%, rgba(232,101,26,0.0) 0%, rgba(10,10,8,0.5) 75%, #0A0A08 100%)',
};

const BOTTOM_GRADIENT_STYLE: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: 360,
  background:
    'linear-gradient(180deg, transparent 0%, rgba(10,10,8,0.85) 50%, #0A0A08 100%)',
};

function heroHeight(isDesktop: boolean, isWide: boolean): number | string {
  return isDesktop ? 'min(58vh, 580px)' : isWide ? 520 : 460;
}

/** Shared hero photo + overlays for Home and Event — keep in sync here. */
export function EventHeroBackground({
  src,
  children,
}: {
  src: string;
  children?: ReactNode;
}) {
  const { isWide, isDesktop } = useResponsive();

  return (
    <div
      className="hof-hero-full-bleed"
      style={{
        position: 'relative',
        height: heroHeight(isDesktop, isWide),
        overflow: 'hidden',
      }}
    >
      <img src={src} alt="" style={HERO_IMAGE_STYLE} />
      <div style={WARM_VIGNETTE_STYLE} />
      <div style={BOTTOM_GRADIENT_STYLE} />
      {children ? (
        <div
          className="hof-hero-content"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
