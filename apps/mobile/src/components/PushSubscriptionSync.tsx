'use client';

import { useEffect, useState } from 'react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useSupabaseUserId } from '@/hooks/useSupabaseUserId';

/** Syncs browser push subscription when the member is signed in. */
export function PushSubscriptionSync() {
  const userId = useSupabaseUserId();
  const [pushEnabled, setPushEnabled] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!userId) {
      setPushEnabled(undefined);
      return;
    }

    let cancelled = false;
    fetch('/api/user/settings')
      .then((r) => (r.ok ? r.json() : { settings: {} }))
      .then((d: { settings?: { push_notifications?: boolean } }) => {
        if (cancelled) return;
        const settings = d.settings ?? {};
        setPushEnabled(settings.push_notifications ?? true);
      })
      .catch(() => {
        if (!cancelled) setPushEnabled(true);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  usePushSubscription(pushEnabled);
  return null;
}
