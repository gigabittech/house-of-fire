'use client';

import { useCallback, useEffect, useRef } from 'react';
import { syncPushSubscription } from '@/lib/push/client';
import { useSupabaseUserId } from '@/hooks/useSupabaseUserId';

/** Keeps the browser push subscription aligned with profile settings. */
export function usePushSubscription(pushEnabled: boolean | undefined) {
  const userId = useSupabaseUserId();
  const lastSync = useRef<boolean | undefined>(undefined);

  const refresh = useCallback(async () => {
    if (!userId || pushEnabled === undefined) return;
    if (lastSync.current === pushEnabled) return;
    lastSync.current = pushEnabled;
    await syncPushSubscription(pushEnabled);
  }, [pushEnabled, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);
}
