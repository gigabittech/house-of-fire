'use client';

import { DoorQrScanner, DoorScanResult, type CameraState, type DoorScanResultData } from '@hof/ui';
import { processDoorScan } from '@hof/door-checkin';
import {
  drainCheckInQueue,
  getQueuedCheckIns,
  prefetchGuestCache,
  hydrateGuestCacheFromIdb,
  startDoorSyncService,
} from '@hof/door-checkin';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const SCAN_API = '/api/crew/door/scan';
const CACHE_API = '/api/crew/door/guest-cache';

export default function CrewDoorPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventLabel, setEventLabel] = useState('Loading…');
  const [scanResult, setScanResult] = useState<DoorScanResultData | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>('starting');
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    async function gate() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
          setAllowed(false);
          return;
        }
        const data = (await res.json()) as { profile?: { role?: string } };
        const role = data.profile?.role;
        if (role !== 'crew' && role !== 'admin') {
          setAllowed(false);
          return;
        }
        setAllowed(true);

        const evRes = await fetch('/api/events/upcoming');
        const evData = (await evRes.json()) as {
          event?: { id: string; name: string; edition_number: number };
        };
        if (evData.event) {
          setEventId(evData.event.id);
          setEventLabel(`${evData.event.name} · Edition ${evData.event.edition_number}`);
          void hydrateGuestCacheFromIdb(evData.event.id).then((c) => {
            if (!c) void prefetchGuestCache(evData.event!.id, CACHE_API);
          });
        }
      } catch {
        setAllowed(false);
      }
    }
    void gate();
  }, []);

  useEffect(() => {
    const refresh = () => {
      setOnline(navigator.onLine);
      setPending(getQueuedCheckIns().length);
    };
    refresh();
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    const id = setInterval(refresh, 4000);
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    return startDoorSyncService(SCAN_API, {
      onSynced: () => setPending(getQueuedCheckIns().length),
      onQueueChange: setPending,
    });
  }, []);

  const handleScan = useCallback(
    async (rawCode: string) => {
      setScanning(true);
      setScanResult({ state: 'loading' });
      const result = await processDoorScan(rawCode, {
        eventId,
        scanApiPath: SCAN_API,
      });
      setScanResult(result);
      setScanning(false);
    },
    [eventId],
  );

  if (allowed === null) {
    return (
      <main style={{ padding: 24, color: 'var(--hof-text, #f5f2eb)' }}>Loading door scanner…</main>
    );
  }

  if (!allowed) {
    return (
      <main style={{ padding: 24, maxWidth: 420, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Crew access required</h1>
        <p style={{ color: '#9a958c', marginBottom: 16 }}>
          Sign in with a crew or admin account to use door check-in.
        </p>
        <button
          type="button"
          onClick={() => router.push('/sign-in')}
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            background: '#e8651a',
            border: 'none',
            color: '#0a0a08',
            fontWeight: 600,
          }}
        >
          Sign in
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#0a0a08',
        color: '#f5f2eb',
        padding: '16px 16px 32px',
        maxWidth: 520,
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.2em',
            color: '#9a958c',
            textTransform: 'uppercase',
          }}
        >
          Door check-in
        </div>
        <h1 style={{ fontSize: 22, margin: '4px 0 0', fontWeight: 600 }}>{eventLabel}</h1>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, fontSize: 12 }}>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #2a2826',
            color: online ? '#4caf6e' : '#e84a1a',
          }}
        >
          {online ? 'Online' : 'Offline'}
        </span>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #2a2826',
            color: '#9a958c',
          }}
        >
          Camera: {cameraState === 'live' ? 'live' : cameraState}
        </span>
        {pending > 0 && (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #e8651a',
              color: '#e8651a',
            }}
          >
            {pending} queued
          </span>
        )}
        {eventId && (
          <button
            type="button"
            onClick={() => void prefetchGuestCache(eventId, CACHE_API)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #2a2826',
              background: 'transparent',
              color: '#e8651a',
            }}
          >
            Refresh guest list
          </button>
        )}
        {pending > 0 && (
          <button
            type="button"
            onClick={() =>
              void drainCheckInQueue(SCAN_API).then(() => setPending(getQueuedCheckIns().length))
            }
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #4caf6e',
              background: 'transparent',
              color: '#4caf6e',
            }}
          >
            Sync now
          </button>
        )}
      </div>

      <DoorQrScanner
        height="min(52vh, 380px)"
        onScan={handleScan}
        scanning={scanning}
        onCameraStateChange={setCameraState}
      />

      <div style={{ marginTop: 12 }}>
        <DoorScanResult result={scanResult} onDismiss={() => setScanResult(null)} />
      </div>
    </main>
  );
}
