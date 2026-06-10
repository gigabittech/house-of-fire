'use client';

import { RealtimeDisconnectedBanner, RealtimeProvider } from '@hof/realtime';

export function RealtimeShell({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      {children}
      <RealtimeDisconnectedBanner />
    </RealtimeProvider>
  );
}
