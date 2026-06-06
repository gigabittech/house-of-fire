'use client';

import { layoutWidth } from '@hof/design-tokens';
import { useResponsive } from '@hof/ui';
import type { CSSProperties } from 'react';

/** Shared horizontal track — every landing section uses this for aligned edges. */
export function useLandingLayout() {
  const { isWide, isDesktop } = useResponsive();
  const horizontalPad = isWide ? 32 : 16;
  const contentMaxWidth = isDesktop
    ? layoutWidth.marketingDesktop
    : isWide
      ? layoutWidth.marketingTablet
      : undefined;

  const pageColumn: CSSProperties = {
    width: '100%',
    maxWidth: contentMaxWidth,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: horizontalPad,
    paddingRight: horizontalPad,
    boxSizing: 'border-box',
  };

  return { isWide, isDesktop, horizontalPad, pageColumn };
}
