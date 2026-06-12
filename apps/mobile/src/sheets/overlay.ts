import type { CSSProperties } from 'react';

/** Above sidebar (z-index 100) and mobile bottom nav. */
export const APP_OVERLAY_Z = 150;

export function appOverlayFixed(): CSSProperties {
  return {
    position: 'fixed',
    zIndex: APP_OVERLAY_Z,
  };
}
