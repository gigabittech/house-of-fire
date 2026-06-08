import { layoutWidth } from '@hof/design-tokens';
import { useResponsive } from '@hof/ui';
import { useMemo, type CSSProperties } from 'react';

/** Centered main column; pair with `.hof-app-page-scroll` for sidebar offset on tablet/desktop. */
export function useAppPageColumn(): CSSProperties {
  const { isWide, isDesktop } = useResponsive();

  return useMemo(() => {
    const horizontalPad = isWide ? 32 : 16;
    const contentMaxWidth = isDesktop
      ? layoutWidth.appDesktop
      : isWide
        ? layoutWidth.app
        : undefined;

    return {
      width: '100%',
      maxWidth: contentMaxWidth,
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: horizontalPad,
      paddingRight: horizontalPad,
      boxSizing: 'border-box',
    };
  }, [isWide, isDesktop]);
}
