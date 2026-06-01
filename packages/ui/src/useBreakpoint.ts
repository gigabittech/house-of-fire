'use client';

import { useEffect, useState } from 'react';
import { breakpoints } from '@hof/design-tokens';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function fromWidth(w: number): Breakpoint {
  if (w >= breakpoints.desktop) return 'desktop';
  if (w >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}

/**
 * SSR-safe responsive breakpoint hook.
 *
 * Returns 'mobile' during SSR and the very first client render (so server and
 * client markup match — no hydration mismatch), then updates to the real
 * breakpoint after mount and on every resize.
 *
 * Consumers that need to avoid a mobile→desktop layout flash can read `mounted`
 * and defer layout-specific rendering until it's true.
 */
export function useBreakpoint(): { bp: Breakpoint; mounted: boolean } {
  const [bp, setBp] = useState<Breakpoint>('mobile');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setBp(fromWidth(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return { bp, mounted };
}

/** Convenience booleans derived from the current breakpoint. */
export function useResponsive(): {
  bp: Breakpoint;
  mounted: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** tablet OR desktop — i.e. anything that uses the sidebar nav */
  isWide: boolean;
} {
  const { bp, mounted } = useBreakpoint();
  return {
    bp,
    mounted,
    isMobile: bp === 'mobile',
    isTablet: bp === 'tablet',
    isDesktop: bp === 'desktop',
    isWide: bp === 'tablet' || bp === 'desktop',
  };
}
