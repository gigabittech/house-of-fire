'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({
  client,
  children,
}: {
  client: SupabaseClient;
  children: React.ReactNode;
}) {
  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

export function useRealtimeSupabase(fallback?: SupabaseClient): SupabaseClient {
  const fromContext = useContext(SupabaseContext);
  const client = fromContext ?? fallback;
  if (!client) {
    throw new Error(
      'useRealtimeSupabase: pass supabase to RealtimeProvider or provide fallback client',
    );
  }
  return client;
}
