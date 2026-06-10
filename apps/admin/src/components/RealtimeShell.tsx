'use client';

import { RealtimeDisconnectedBanner, RealtimeProvider } from '@hof/realtime';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export function RealtimeShell({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider supabase={supabase}>
      {children}
      <RealtimeDisconnectedBanner />
    </RealtimeProvider>
  );
}
