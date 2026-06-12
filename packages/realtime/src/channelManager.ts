import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChannelEntry, PostgresChangePayload, RealtimeEventType } from './types';

const channels = new Map<string, ChannelEntry>();

function channelKey(schema: string, table: string, filter?: string): string {
  return `${schema}:${table}:${filter ?? '*'}`;
}

function channelName(schema: string, table: string, filter?: string): string {
  const safe = (filter ?? 'all').replace(/[^a-zA-Z0-9_=.-]/g, '_');
  return `rt:${schema}:${table}:${safe}`;
}

type SubscribeOpts = {
  supabase: SupabaseClient;
  schema: string;
  table: string;
  filter?: string;
  eventTypes: RealtimeEventType[];
  onPayload: (payload: PostgresChangePayload) => void;
  onStatus?: (status: string) => void;
};

export function subscribeChannel(opts: SubscribeOpts): () => void {
  const key = channelKey(opts.schema, opts.table, opts.filter);
  let entry = channels.get(key);

  if (!entry) {
    const name = channelName(opts.schema, opts.table, opts.filter);
    const ch = opts.supabase.channel(name);

    for (const eventType of opts.eventTypes) {
      const config: {
        event: RealtimeEventType;
        schema: string;
        table: string;
        filter?: string;
      } = {
        event: eventType,
        schema: opts.schema,
        table: opts.table,
      };
      if (opts.filter) config.filter = opts.filter;

      ch.on('postgres_changes', config, (payload) => {
        const current = channels.get(key);
        if (!current) return;
        const normalized: PostgresChangePayload = {
          eventType: payload.eventType as RealtimeEventType,
          new: (payload.new ?? {}) as Record<string, unknown>,
          old: (payload.old ?? {}) as Record<string, unknown>,
          schema: payload.schema,
          table: payload.table,
          commit_timestamp: (payload as { commit_timestamp?: string }).commit_timestamp,
        };
        for (const listener of current.listeners) {
          listener(normalized);
        }
      });
    }

    ch.subscribe((status) => {
      const current = channels.get(key);
      if (!current) return;
      for (const listener of current.statusListeners) {
        listener(status);
      }
    });

    entry = { channel: ch, refCount: 0, listeners: new Set(), statusListeners: new Set() };
    channels.set(key, entry);
  }

  entry.refCount += 1;
  entry.listeners.add(opts.onPayload);
  const onStatus = opts.onStatus;
  if (onStatus) {
    entry.statusListeners.add(onStatus);
  }

  return () => {
    const current = channels.get(key);
    if (!current) return;
    current.listeners.delete(opts.onPayload);
    if (onStatus) {
      current.statusListeners.delete(onStatus);
    }
    current.refCount -= 1;
    if (current.refCount <= 0 && current.listeners.size === 0) {
      void current.channel.unsubscribe();
      channels.delete(key);
    }
  };
}

export function getActiveChannelCount(): number {
  return channels.size;
}
