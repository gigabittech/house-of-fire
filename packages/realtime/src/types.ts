import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type PostgresChangePayload<T extends Record<string, unknown> = Record<string, unknown>> = {
  eventType: RealtimeEventType;
  new: T;
  old: Partial<T>;
  schema: string;
  table: string;
  commit_timestamp?: string;
};

export type UseSupabaseRealtimeOptions<T extends Record<string, unknown> = Record<string, unknown>> = {
  supabase: SupabaseClient;
  table: string;
  schema?: string;
  filter?: string;
  eventTypes?: RealtimeEventType[];
  onInsert?: (row: T, payload: PostgresChangePayload<T>) => void;
  onUpdate?: (row: T, oldRow: Partial<T>, payload: PostgresChangePayload<T>) => void;
  onDelete?: (oldRow: Partial<T>, payload: PostgresChangePayload<T>) => void;
  enabled?: boolean;
  debounceMs?: number;
  onResync?: () => void;
};

export type ChannelEntry = {
  channel: RealtimeChannel;
  refCount: number;
  listeners: Set<(payload: PostgresChangePayload) => void>;
};
