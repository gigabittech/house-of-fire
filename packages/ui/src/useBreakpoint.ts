'use client';

import { breakpoints } from '@hof/design-tokens';
import { useSyncExternalStore } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function fromWidth(w: number): Breakpoint {
  if (w >= breakpoints.desktop) return 'desktop';
  if (w >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener('resize', onStoreChange);
  return () => window.removeEventListener('resize', onStoreChange);
}

function getSnapshot(): Breakpoint {
  return fromWidth(window.innerWidth);
}

function getServerSnapshot(): Breakpoint {
  return 'mobile';
}

/**
 * Responsive breakpoint hook backed by `useSyncExternalStore`.
 *
 * Reads `window.innerWidth` synchronously on the client (including the first
 * hydration render) so wide layouts don't wait for a post-mount effect.
 * SSR still emits the mobile snapshot; pair structural layout with CSS media
 * queries (see tokens.css) to avoid a flash before hydration.
 */
export function useBreakpoint(): { bp: Breakpoint; mounted: boolean } {
  const bp = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
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
