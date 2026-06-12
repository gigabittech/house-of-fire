'use client';

import { useEffect } from 'react';
import { useAppHeaderContext } from '@/context/AppHeaderContext';

/** Hide app chrome (sidebar / bottom nav) while a full-screen overlay is open. */
export function useChromeOverlay(
  active: boolean,
  options?: { sidebar?: boolean; bottomNav?: boolean },
) {
  const { setChromeOverlay } = useAppHeaderContext();
  const hideSidebar = options?.sidebar ?? true;
  const hideBottomNav = options?.bottomNav ?? true;

  useEffect(() => {
    if (!active) return;
    setChromeOverlay({ hideSidebar, hideBottomNav });
    return () => setChromeOverlay({});
  }, [active, hideSidebar, hideBottomNav, setChromeOverlay]);
}
