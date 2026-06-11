import { normalizeTicketCode } from './codes';
import type { QueuedCheckIn, ScanApiSuccess } from './types';

const STORAGE_KEY = 'hof-door-checkin-queue';
const RECENT_MS = 8_000;

const recentScans = new Map<string, number>();

function readQueue(): QueuedCheckIn[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as QueuedCheckIn[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedCheckIn[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getQueuedCheckIns(): QueuedCheckIn[] {
  return readQueue();
}

export function isCodeQueued(rawCode: string): boolean {
  const code = normalizeTicketCode(rawCode);
  return readQueue().some((q) => normalizeTicketCode(q.code) === code);
}

export function wasRecentlyScanned(rawCode: string): boolean {
  const code = normalizeTicketCode(rawCode);
  const at = recentScans.get(code);
  if (!at) return false;
  if (Date.now() - at > RECENT_MS) {
    recentScans.delete(code);
    return false;
  }
  return true;
}

function markRecentlyScanned(rawCode: string): void {
  recentScans.set(normalizeTicketCode(rawCode), Date.now());
}

export function enqueueCheckIn(
  item: Omit<QueuedCheckIn, 'scanned_at'> & { scanned_at?: string },
): boolean {
  const code = normalizeTicketCode(item.code);
  if (wasRecentlyScanned(item.code) || isCodeQueued(item.code)) {
    return false;
  }

  const queue = readQueue();
  if (queue.some((q) => q.client_scan_id === item.client_scan_id)) return false;
  if (queue.some((q) => normalizeTicketCode(q.code) === code)) return false;

  queue.push({
    ...item,
    code: item.code.trim(),
    scanned_at: item.scanned_at ?? new Date().toISOString(),
  });
  writeQueue(queue);
  markRecentlyScanned(item.code);
  return true;
}

export function removeQueuedCheckIn(clientScanId: string): void {
  writeQueue(readQueue().filter((q) => q.client_scan_id !== clientScanId));
}

export function generateClientScanId(): string {
  return crypto.randomUUID();
}

export async function postCheckIn(
  payload: QueuedCheckIn,
  apiPath = '/api/admin/door/scan',
): Promise<
  | { ok: true; data: ScanApiSuccess }
  | { ok: false; error: string; retryable: boolean; status: number; data?: ScanApiSuccess }
> {
  try {
    const res = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: payload.code,
        client_scan_id: payload.client_scan_id,
        scanned_at: payload.scanned_at,
        event_id: payload.event_id,
      }),
    });
    const data = (await res.json()) as ScanApiSuccess;

    if (!res.ok) {
      const retryable = res.status >= 500 || res.status === 0;
      const conflictOk =
        res.status === 409 &&
        (data.outcome === 'already_used' || data.outcome === 'already_checked_in');
      return {
        ok: false,
        error: data.error ?? 'Check-in failed',
        retryable: retryable && !conflictOk,
        status: res.status,
        data,
      };
    }

    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Network error', retryable: true, status: 0 };
  }
}

export type DrainResult = {
  synced: number;
  failed: number;
  duplicates: number;
};

export async function drainCheckInQueue(apiPath = '/api/admin/door/scan'): Promise<DrainResult> {
  const queue = readQueue();
  let synced = 0;
  let failed = 0;
  let duplicates = 0;

  for (const item of queue) {
    const result = await postCheckIn(item, apiPath);
    if (result.ok) {
      removeQueuedCheckIn(item.client_scan_id);
      synced++;
      continue;
    }

    if (result.status === 409) {
      removeQueuedCheckIn(item.client_scan_id);
      duplicates++;
      continue;
    }

    if (!result.retryable) {
      removeQueuedCheckIn(item.client_scan_id);
      failed++;
    } else {
      failed++;
    }
  }

  return { synced, failed, duplicates };
}
