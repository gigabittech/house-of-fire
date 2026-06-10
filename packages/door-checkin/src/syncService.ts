import { drainCheckInQueue, getQueuedCheckIns } from './queue';

export type DoorSyncCallbacks = {
  onSynced?: (result: { synced: number; failed: number; duplicates: number }) => void;
  onQueueChange?: (pending: number) => void;
};

const DEFAULT_INTERVAL_MS = 30_000;

export function startDoorSyncService(
  apiPath: string,
  callbacks: DoorSyncCallbacks = {},
  intervalMs = DEFAULT_INTERVAL_MS,
): () => void {
  if (typeof window === 'undefined') return () => {};

  let draining = false;

  const refreshPending = () => {
    callbacks.onQueueChange?.(getQueuedCheckIns().length);
  };

  const drain = async () => {
    if (draining || !navigator.onLine) return;
    if (getQueuedCheckIns().length === 0) return;
    draining = true;
    try {
      const result = await drainCheckInQueue(apiPath);
      refreshPending();
      if (result.synced > 0 || result.duplicates > 0) {
        callbacks.onSynced?.(result);
      }
    } finally {
      draining = false;
    }
  };

  refreshPending();

  const onOnline = () => void drain();
  window.addEventListener('online', onOnline);

  const onVisible = () => {
    if (document.visibilityState === 'visible') void drain();
  };
  document.addEventListener('visibilitychange', onVisible);

  const intervalId = setInterval(() => void drain(), intervalMs);

  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
    clearInterval(intervalId);
  };
}
