'use client';

import { useEffect, useRef, useState } from 'react';
import { subscribeChannel } from './channelManager';
import { RealtimeDedupe, rowId, rowsEqual } from './dedupe';
import { useRealtimeStatus } from './RealtimeProvider';
import { useRealtimeSupabase } from './supabaseContext';
import type {
  PostgresChangePayload,
  RealtimeConnectionStatus,
  RealtimeEventType,
  UseSupabaseRealtimeOptions,
} from './types';

function processPayload<T extends Record<string, unknown>>(
  payload: PostgresChangePayload<T>,
  dedupe: RealtimeDedupe,
  handlers: {
    onInsert?: UseSupabaseRealtimeOptions<T>['onInsert'];
    onUpdate?: UseSupabaseRealtimeOptions<T>['onUpdate'];
    onDelete?: UseSupabaseRealtimeOptions<T>['onDelete'];
  },
): void {
  const id = rowId(payload.new as Record<string, unknown>) || rowId(payload.old as Record<string, unknown>);
  if (!dedupe.shouldProcess(payload.table, id, payload.eventType, payload.commit_timestamp)) {
    return;
  }

  if (payload.eventType === 'INSERT' && handlers.onInsert) {
    handlers.onInsert(payload.new, payload);
    return;
  }

  if (payload.eventType === 'UPDATE' && handlers.onUpdate) {
    if (rowsEqual(payload.new as Record<string, unknown>, payload.old as Record<string, unknown>)) {
      return;
    }
    handlers.onUpdate(payload.new, payload.old, payload);
    return;
  }

  if (payload.eventType === 'DELETE' && handlers.onDelete) {
    handlers.onDelete(payload.old, payload);
  }
}

export function useSupabaseRealtime<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseSupabaseRealtimeOptions<T>,
): { status: RealtimeConnectionStatus } {
  const {
    supabase: supabaseProp,
    table,
    schema = 'public',
    filter,
    eventTypes = ['INSERT', 'UPDATE', 'DELETE'],
    onInsert,
    onUpdate,
    onDelete,
    enabled = true,
    debounceMs = 0,
    onResync,
  } = options;

  const supabase = useRealtimeSupabase(supabaseProp);
  const { setStatus: setGlobalStatus } = useRealtimeStatus();
  const [status, setStatus] = useState<RealtimeConnectionStatus>('connecting');

  const handlersRef = useRef({ onInsert, onUpdate, onDelete, onResync });
  const dedupeRef = useRef(new RealtimeDedupe());
  const wasConnectedRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<PostgresChangePayload<T> | null>(null);

  useEffect(() => {
    handlersRef.current = { onInsert, onUpdate, onDelete, onResync };
  }, [onInsert, onUpdate, onDelete, onResync]);

  useEffect(() => {
    if (!enabled) {
      setStatus('disconnected');
      return;
    }

    dedupeRef.current.clear();

    const flush = (payload: PostgresChangePayload<T>) => {
      processPayload(payload, dedupeRef.current, handlersRef.current);
    };

    const onPayload = (payload: PostgresChangePayload) => {
      const typed = payload as PostgresChangePayload<T>;
      if (debounceMs > 0) {
        pendingPayloadRef.current = typed;
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          if (pendingPayloadRef.current) {
            flush(pendingPayloadRef.current);
            pendingPayloadRef.current = null;
          }
        }, debounceMs);
        return;
      }
      flush(typed);
    };

    const unsubscribe = subscribeChannel({
      supabase,
      schema,
      table,
      filter,
      eventTypes: eventTypes as RealtimeEventType[],
      onPayload,
      onStatus: (channelStatus) => {
        if (channelStatus === 'SUBSCRIBED') {
          setStatus('connected');
          setGlobalStatus('connected');
          if (wasConnectedRef.current && handlersRef.current.onResync) {
            handlersRef.current.onResync();
          }
          wasConnectedRef.current = true;
        } else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
          setStatus('error');
          setGlobalStatus('error');
        } else if (channelStatus === 'CLOSED') {
          setStatus('disconnected');
          setGlobalStatus('disconnected');
        } else {
          setStatus('connecting');
          setGlobalStatus('connecting');
        }
      },
    });

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      unsubscribe();
      setStatus('disconnected');
    };
  }, [table, schema, filter, enabled, debounceMs, eventTypes.join(','), setGlobalStatus, supabase]);

  return { status };
}
