'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SupabaseProvider } from './supabaseContext';
import type { RealtimeConnectionStatus } from './types';

type RealtimeContextValue = {
  status: RealtimeConnectionStatus;
  setStatus: (status: RealtimeConnectionStatus) => void;
  disconnectedSince: number | null;
  showDisconnectedBanner: boolean;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const BANNER_DELAY_MS = 30_000;

export function RealtimeProvider({
  children,
  supabase,
}: {
  children: React.ReactNode;
  supabase: SupabaseClient;
}) {
  const [status, setStatusState] = useState<RealtimeConnectionStatus>('connecting');
  const [disconnectedSince, setDisconnectedSince] = useState<number | null>(null);
  const [showDisconnectedBanner, setShowDisconnectedBanner] = useState(false);

  const setStatus = useCallback((next: RealtimeConnectionStatus) => {
    setStatusState(next);
    if (next === 'connected') {
      setDisconnectedSince(null);
      setShowDisconnectedBanner(false);
    } else if (next === 'disconnected' || next === 'error') {
      setDisconnectedSince((prev) => prev ?? Date.now());
    }
  }, []);

  useEffect(() => {
    if (status !== 'disconnected' && status !== 'error') return;
    const id = setInterval(() => {
      if (disconnectedSince && Date.now() - disconnectedSince >= BANNER_DELAY_MS) {
        setShowDisconnectedBanner(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [status, disconnectedSince]);

  const value = useMemo(
    () => ({ status, setStatus, disconnectedSince, showDisconnectedBanner }),
    [status, setStatus, disconnectedSince, showDisconnectedBanner],
  );

  return (
    <SupabaseProvider client={supabase}>
      <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
    </SupabaseProvider>
  );
}

export function useRealtimeStatus(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    return {
      status: 'connected',
      setStatus: () => {},
      disconnectedSince: null,
      showDisconnectedBanner: false,
    };
  }
  return ctx;
}

export function RealtimeDisconnectedBanner() {
  const { showDisconnectedBanner, status } = useRealtimeStatus();
  if (!showDisconnectedBanner) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: '8px 16px',
        borderRadius: 8,
        background: 'rgba(180, 60, 40, 0.95)',
        color: '#fff',
        fontSize: 13,
        fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      }}
    >
      Live sync paused ({status}). Reconnecting…
    </div>
  );
}
