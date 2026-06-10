'use client';

import { useCallback, useEffect, useState } from 'react';
import { getGuestCacheMeta, prefetchGuestCache } from '@/lib/doorGuestCache';
import { getQueuedCheckIns } from '@/lib/doorCheckInQueue';

function formatAge(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function DoorOfflineStatus({
  eventId,
  onRefreshed,
}: {
  eventId: string | null;
  onRefreshed?: () => void;
}) {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [cacheMeta, setCacheMeta] = useState<{ fetchedAt: string; count: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    setPending(getQueuedCheckIns().length);
    if (eventId) setCacheMeta(getGuestCacheMeta(eventId));
  }, [eventId]);

  useEffect(() => {
    refresh();
    const onOnline = () => refresh();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOnline);
    const id = setInterval(refresh, 5000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOnline);
      clearInterval(id);
    };
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [eventId, refresh]);

  async function downloadGuestList() {
    if (!eventId) return;
    setRefreshing(true);
    try {
      await prefetchGuestCache(eventId);
      refresh();
      onRefreshed?.();
    } finally {
      setRefreshing(false);
    }
  }

  const ready = cacheMeta && cacheMeta.count > 0;
  const stale = cacheMeta
    ? Date.now() - new Date(cacheMeta.fetchedAt).getTime() > 30 * 60_000
    : true;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
        fontFamily: 'Inter, system-ui',
        fontSize: 12,
        color: 'var(--hof-text-sec)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          borderRadius: 6,
          border: '1px solid var(--hof-border)',
          background: online ? 'rgba(76,175,110,0.08)' : 'rgba(232,74,26,0.08)',
          color: online ? 'var(--hof-success)' : 'var(--hof-error)',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: 'currentColor',
          }}
        />
        {online ? 'Online' : 'Offline mode'}
      </span>

      {cacheMeta ? (
        <span style={{ padding: '5px 10px', border: '1px solid var(--hof-border)', borderRadius: 6 }}>
          Guest list: {cacheMeta.count.toLocaleString()} · {formatAge(cacheMeta.fetchedAt)}
          {stale ? ' · refresh recommended' : ''}
        </span>
      ) : (
        <span style={{ padding: '5px 10px', border: '1px solid var(--hof-border)', borderRadius: 6 }}>
          No offline guest list — download before doors
        </span>
      )}

      {pending > 0 && (
        <span
          style={{
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid var(--hof-amber)',
            color: 'var(--hof-amber)',
          }}
        >
          {pending} queued check-in{pending === 1 ? '' : 's'}
        </span>
      )}

      {eventId && (
        <button
          type="button"
          disabled={refreshing}
          onClick={() => void downloadGuestList()}
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid var(--hof-border)',
            background: 'var(--hof-surface)',
            color: 'var(--hof-amber)',
            fontWeight: 600,
            cursor: refreshing ? 'wait' : 'pointer',
          }}
        >
          {refreshing ? 'Downloading…' : ready ? 'Refresh guest list' : 'Download guest list'}
        </button>
      )}
    </div>
  );
}
