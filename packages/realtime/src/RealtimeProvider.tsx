'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { SupabaseProvider } from './supabaseContext';
import type { RealtimeConnectionStatus } from './types';

type RealtimeContextValue = {
  status: RealtimeConnectionStatus;
  registerConnection: (id: string, status: RealtimeConnectionStatus) => void;
  unregisterConnection: (id: string) => void;
  disconnectedSince: number | null;
  showDisconnectedBanner: boolean;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const BANNER_DELAY_MS = 30_000;

function aggregateStatus(statuses: RealtimeConnectionStatus[]): RealtimeConnectionStatus {
  if (statuses.length === 0) return 'connected';
  if (statuses.some((s) => s === 'error')) return 'error';
  if (statuses.some((s) => s === 'disconnected')) return 'disconnected';
  if (statuses.some((s) => s === 'connecting')) return 'connecting';
  return 'connected';
}

export function RealtimeProvider({
  children,
  supabase,
}: {
  children: React.ReactNode;
  supabase: SupabaseClient;
}) {
  const connectionsRef = useRef(new Map<string, RealtimeConnectionStatus>());
  const [status, setStatusState] = useState<RealtimeConnectionStatus>('connecting');
  const [disconnectedSince, setDisconnectedSince] = useState<number | null>(null);
  const [showDisconnectedBanner, setShowDisconnectedBanner] = useState(false);

  const applyGlobalStatus = useCallback((next: RealtimeConnectionStatus) => {
    setStatusState(next);
    if (next === 'connected') {
      setDisconnectedSince(null);
      setShowDisconnectedBanner(false);
    } else if (next === 'disconnected' || next === 'error') {
      setDisconnectedSince((prev) => prev ?? Date.now());
    }
  }, []);

  const registerConnection = useCallback(
    (id: string, next: RealtimeConnectionStatus) => {
      connectionsRef.current.set(id, next);
      applyGlobalStatus(aggregateStatus([...connectionsRef.current.values()]));
    },
    [applyGlobalStatus],
  );

  const unregisterConnection = useCallback(
    (id: string) => {
      connectionsRef.current.delete(id);
      applyGlobalStatus(aggregateStatus([...connectionsRef.current.values()]));
    },
    [applyGlobalStatus],
  );

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
    () => ({
      status,
      registerConnection,
      unregisterConnection,
      disconnectedSince,
      showDisconnectedBanner,
    }),
    [status, registerConnection, unregisterConnection, disconnectedSince, showDisconnectedBanner],
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
      registerConnection: () => {},
      unregisterConnection: () => {},
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
