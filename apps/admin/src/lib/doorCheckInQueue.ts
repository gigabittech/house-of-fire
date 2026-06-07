const STORAGE_KEY = 'hof-admin-door-checkin-queue';

export type QueuedCheckIn = {
  client_scan_id: string;
  code: string;
  scanned_at: string;
};

function readQueue(): QueuedCheckIn[] {
  if (typeof window === 'undefined') return [];
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
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getQueuedCheckIns(): QueuedCheckIn[] {
  return readQueue();
}

export function enqueueCheckIn(item: Omit<QueuedCheckIn, 'scanned_at'> & { scanned_at?: string }): void {
  const queue = readQueue();
  if (queue.some((q) => q.client_scan_id === item.client_scan_id)) return;
  queue.push({
    ...item,
    scanned_at: item.scanned_at ?? new Date().toISOString(),
  });
  writeQueue(queue);
}

export function removeQueuedCheckIn(clientScanId: string): void {
  writeQueue(readQueue().filter((q) => q.client_scan_id !== clientScanId));
}

export function generateClientScanId(): string {
  return crypto.randomUUID();
}

export type ScanApiSuccess = {
  ok?: boolean;
  outcome?: string;
  holder?: { display_name: string; handle?: string | null };
  tier?: { display_name: string; name: string } | null;
  code?: string;
  used_at?: string;
  checkedInAt?: string;
  error?: string;
};

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
      body: JSON.stringify({ code: payload.code }),
    });
    const data = (await res.json()) as ScanApiSuccess;

    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? 'Check-in failed',
        retryable: res.status >= 500 || res.status === 0,
        status: res.status,
        data,
      };
    }

    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Network error', retryable: true, status: 0 };
  }
}

export async function drainCheckInQueue(apiPath = '/api/admin/door/scan'): Promise<{
  synced: number;
  failed: number;
}> {
  const queue = readQueue();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    const result = await postCheckIn(item, apiPath);
    if (result.ok) {
      removeQueuedCheckIn(item.client_scan_id);
      synced++;
    } else if (!result.retryable) {
      removeQueuedCheckIn(item.client_scan_id);
      failed++;
    } else {
      failed++;
    }
  }

  return { synced, failed };
}
