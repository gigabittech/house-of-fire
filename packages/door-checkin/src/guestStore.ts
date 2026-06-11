import { normalizeTicketCode } from './codes';
import type { CachedGuestTicket, GuestCachePayload } from './types';

const DB_NAME = 'hof-door-guest-cache';
const DB_VERSION = 1;
const META_STORE = 'meta';
const TICKET_STORE = 'tickets';

const memoryIndex = new Map<string, Map<string, CachedGuestTicket>>();

function indexKey(eventId: string): string {
  return eventId;
}

function buildIndex(payload: GuestCachePayload): Map<string, CachedGuestTicket> {
  const map = new Map<string, CachedGuestTicket>();
  for (const t of payload.tickets) {
    map.set(t.code.toUpperCase(), t);
  }
  return map;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error('idb open failed'));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'eventId' });
      }
      if (!db.objectStoreNames.contains(TICKET_STORE)) {
        const store = db.createObjectStore(TICKET_STORE, { keyPath: 'key' });
        store.createIndex('eventId', 'eventId', { unique: false });
        store.createIndex('code', 'code', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

async function idbWriteCache(payload: GuestCachePayload): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([META_STORE, TICKET_STORE], 'readwrite');
    tx.onerror = () => reject(tx.error ?? new Error('idb write failed'));
    tx.oncomplete = () => resolve();

    tx.objectStore(META_STORE).put({
      eventId: payload.eventId,
      fetchedAt: payload.fetchedAt,
      count: payload.tickets.length,
    });

    const ticketStore = tx.objectStore(TICKET_STORE);
    const index = ticketStore.index('eventId');
    const keyReq = index.getAllKeys(IDBKeyRange.only(payload.eventId));
    keyReq.onsuccess = () => {
      for (const key of keyReq.result as IDBValidKey[]) {
        ticketStore.delete(key);
      }
      for (const t of payload.tickets) {
        ticketStore.put({
          key: `${payload.eventId}:${t.code.toUpperCase()}`,
          eventId: payload.eventId,
          code: t.code.toUpperCase(),
          ticket: t,
        });
      }
    };
    keyReq.onerror = () => reject(keyReq.error ?? new Error('idb key purge failed'));
  });
  db.close();
}

async function idbReadCache(eventId: string): Promise<GuestCachePayload | null> {
  const db = await openDb();
  const meta = await new Promise<{ fetchedAt: string; count: number } | null>((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readonly');
    const req = tx.objectStore(META_STORE).get(eventId);
    req.onerror = () => reject(req.error ?? new Error('idb meta read failed'));
    req.onsuccess = () => {
      const row = req.result as { fetchedAt?: string; count?: number } | undefined;
      if (!row?.fetchedAt) resolve(null);
      else resolve({ fetchedAt: row.fetchedAt, count: row.count ?? 0 });
    };
  });

  if (!meta) {
    db.close();
    return null;
  }

  const tickets = await new Promise<CachedGuestTicket[]>((resolve, reject) => {
    const out: CachedGuestTicket[] = [];
    const tx = db.transaction(TICKET_STORE, 'readonly');
    const index = tx.objectStore(TICKET_STORE).index('eventId');
    const req = index.openCursor(IDBKeyRange.only(eventId));
    req.onerror = () => reject(req.error ?? new Error('idb ticket read failed'));
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve(out);
        return;
      }
      const row = cursor.value as { ticket: CachedGuestTicket };
      out.push(row.ticket);
      cursor.continue();
    };
  });

  db.close();
  return { eventId, fetchedAt: meta.fetchedAt, tickets };
}

const LS_PREFIX = 'hof-door-guest-cache';

function lsKey(eventId: string): string {
  return `${LS_PREFIX}:${eventId}`;
}

function readLsCache(eventId: string): GuestCachePayload | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(lsKey(eventId));
    if (!raw) return null;
    return JSON.parse(raw) as GuestCachePayload;
  } catch {
    return null;
  }
}

function writeLsCache(payload: GuestCachePayload): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(lsKey(payload.eventId), JSON.stringify(payload));
}

export function writeGuestCache(payload: GuestCachePayload): void {
  memoryIndex.set(indexKey(payload.eventId), buildIndex(payload));
  writeLsCache(payload);
  void idbWriteCache(payload).catch(() => {
    /* localStorage + memory remain usable */
  });
}

export function readGuestCache(eventId: string): GuestCachePayload | null {
  const mem = memoryIndex.get(indexKey(eventId));
  if (mem) {
    const ls = readLsCache(eventId);
    if (ls) return ls;
  }
  const ls = readLsCache(eventId);
  if (ls) {
    memoryIndex.set(indexKey(eventId), buildIndex(ls));
    return ls;
  }
  return null;
}

export async function hydrateGuestCacheFromIdb(eventId: string): Promise<GuestCachePayload | null> {
  try {
    const payload = await idbReadCache(eventId);
    if (!payload) return readGuestCache(eventId);
    writeGuestCache(payload);
    return payload;
  } catch {
    return readGuestCache(eventId);
  }
}

export async function prefetchGuestCache(
  eventId: string,
  apiPath = '/api/admin/door/guest-cache',
): Promise<GuestCachePayload | null> {
  try {
    const res = await fetch(`${apiPath}?eventId=${encodeURIComponent(eventId)}`);
    if (!res.ok) {
      return (await hydrateGuestCacheFromIdb(eventId)) ?? readGuestCache(eventId);
    }
    const data = (await res.json()) as GuestCachePayload;
    writeGuestCache(data);
    return data;
  } catch {
    return (await hydrateGuestCacheFromIdb(eventId)) ?? readGuestCache(eventId);
  }
}

export function lookupCachedTicket(eventId: string, rawCode: string): CachedGuestTicket | null {
  const code = normalizeTicketCode(rawCode);
  const mem = memoryIndex.get(indexKey(eventId));
  if (mem?.has(code)) return mem.get(code)!;

  const cache = readGuestCache(eventId);
  if (!cache) return null;
  const index = buildIndex(cache);
  memoryIndex.set(indexKey(eventId), index);
  return index.get(code) ?? null;
}

export function markCachedTicketUsed(eventId: string, rawCode: string, checkedInAt: string): void {
  const cache = readGuestCache(eventId);
  if (!cache) return;
  const code = normalizeTicketCode(rawCode);
  const tickets = cache.tickets.map((t) =>
    t.code.toUpperCase() === code ? { ...t, status: 'used', checked_in_at: checkedInAt } : t,
  );
  writeGuestCache({ ...cache, tickets });
}

export function getGuestCacheMeta(eventId: string): { fetchedAt: string; count: number } | null {
  const cache = readGuestCache(eventId);
  if (!cache) return null;
  return { fetchedAt: cache.fetchedAt, count: cache.tickets.length };
}
