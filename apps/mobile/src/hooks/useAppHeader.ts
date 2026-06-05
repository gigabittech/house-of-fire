'use client';

import { type ReactNode, useEffect } from 'react';
import { useAppHeaderContext } from '@/context/AppHeaderContext';

/** Register page title, actions, and back handler for app chrome headers. Clears on unmount. */
export function useAppHeader(config: {
  title?: string;
  actions?: ReactNode;
  onBack?: () => void;
  hideMobileHeader?: boolean;
}) {
  const { setConfig } = useAppHeaderContext();

  useEffect(() => {
    setConfig(config);
    return () => setConfig({});
  }, [setConfig, config.title, config.actions, config.onBack, config.hideMobileHeader]);
}
