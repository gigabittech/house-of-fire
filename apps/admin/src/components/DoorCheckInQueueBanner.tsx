'use client';

import { useEffect, useState } from 'react';
import { drainCheckInQueue, getQueuedCheckIns } from '@/lib/doorCheckInQueue';

export function DoorCheckInQueueBanner({ onSynced }: { onSynced: () => void }) {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  function refresh() {
    setPending(getQueuedCheckIns().length);
  }

  useEffect(() => {
    refresh();
    const onOnline = () =>
      void drainCheckInQueue().then(() => {
        refresh();
        onSynced();
      });
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [onSynced]);

  if (pending === 0) return null;

  return (
    <div
      style={{
        margin: '0 28px 12px',
        padding: '10px 14px',
        background: 'rgba(76,175,110,0.10)',
        border: '1px solid var(--hof-success)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 13,
      }}
    >
      <span>
        {pending} check-in{pending === 1 ? '' : 's'} pending sync
      </span>
      <button
        type="button"
        disabled={syncing}
        onClick={() => {
          setSyncing(true);
          void drainCheckInQueue().then(() => {
            refresh();
            onSynced();
            setSyncing(false);
          });
        }}
        style={{
          padding: '6px 12px',
          background: 'var(--hof-success)',
          border: 'none',
          borderRadius: 6,
          fontWeight: 600,
          cursor: 'pointer',
          color: 'var(--hof-bg)',
        }}
      >
        {syncing ? 'Syncing…' : 'Sync now'}
      </button>
    </div>
  );
}
