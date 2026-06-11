'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

export interface AppHeaderConfig {
  title?: string;
  actions?: ReactNode;
  onBack?: () => void;
  hideMobileHeader?: boolean;
}

export interface ChromeOverlayState {
  hideSidebar?: boolean;
  hideBottomNav?: boolean;
}

interface AppHeaderContextValue {
  config: AppHeaderConfig;
  setConfig: (config: AppHeaderConfig) => void;
  chromeOverlay: ChromeOverlayState;
  setChromeOverlay: (overlay: ChromeOverlayState) => void;
}

const AppHeaderContext = createContext<AppHeaderContextValue | null>(null);

export function AppHeaderProvider({
  children,
  defaultTitle,
}: {
  children: ReactNode;
  defaultTitle: string;
}) {
  const [override, setOverride] = useState<AppHeaderConfig>({});
  const [chromeOverlay, setChromeOverlay] = useState<ChromeOverlayState>({});

  const value = useMemo(
    () => ({
      config: {
        title: override.title ?? defaultTitle,
        actions: override.actions,
        onBack: override.onBack,
        hideMobileHeader: override.hideMobileHeader,
      },
      setConfig: setOverride,
      chromeOverlay,
      setChromeOverlay,
    }),
    [
      defaultTitle,
      override.title,
      override.actions,
      override.onBack,
      override.hideMobileHeader,
      chromeOverlay,
    ],
  );

  return <AppHeaderContext.Provider value={value}>{children}</AppHeaderContext.Provider>;
}

export function useAppHeaderContext(): AppHeaderContextValue {
  const ctx = useContext(AppHeaderContext);
  if (!ctx) {
    throw new Error('useAppHeaderContext must be used within AppHeaderProvider');
  }
  return ctx;
}
