'use client';

export { subscribeChannel, getActiveChannelCount } from './channelManager';
export { RealtimeDedupe, rowId, rowsEqual } from './dedupe';
export { clampCount, removeById, updateById, upsertById } from './statePatch';
export { SupabaseProvider, useRealtimeSupabase } from './supabaseContext';
export {
  RealtimeDisconnectedBanner,
  RealtimeProvider,
  useRealtimeStatus,
} from './RealtimeProvider';
export type {
  PostgresChangePayload,
  RealtimeConnectionStatus,
  RealtimeEventType,
  UseSupabaseRealtimeOptions,
} from './types';
export { readRealtimeCache, useRealtimeCache, writeRealtimeCache } from './useRealtimeCache';
export { useDebouncedCallback } from './useDebouncedCallback';
export { useSupabaseRealtime } from './useSupabaseRealtime';
