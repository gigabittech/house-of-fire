const STORAGE_KEY = 'hof-door-sale-queue';

export type QueuedDoorSale = {
  client_sale_id: string;
  tier_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  qty: number;
  pay_method: 'cash' | 'card' | 'tap';
  queued_at: string;
};

function readQueue(): QueuedDoorSale[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as QueuedDoorSale[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedDoorSale[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getQueuedSales(): QueuedDoorSale[] {
  return readQueue();
}

export function enqueueDoorSale(sale: Omit<QueuedDoorSale, 'queued_at'>): void {
  const queue = readQueue();
  if (queue.some((q) => q.client_sale_id === sale.client_sale_id)) return;
  queue.push({ ...sale, queued_at: new Date().toISOString() });
  writeQueue(queue);
}

export function removeQueuedSale(clientSaleId: string): void {
  writeQueue(readQueue().filter((q) => q.client_sale_id !== clientSaleId));
}

export function generateClientSaleId(): string {
  return crypto.randomUUID();
}

export type DoorSellResponse = {
  outcome: string;
  tickets?: Array<{ id: string; code: string; qr_data: string }>;
  holder_name?: string;
  tier_name?: string;
  order_id?: string;
  pay_method?: string;
  subtotal_cents?: number;
  fee_cents?: number;
  total_cents?: number;
  purchased_at?: string;
};

export async function postDoorSale(
  payload: QueuedDoorSale,
): Promise<{ ok: true; data: DoorSellResponse } | { ok: false; error: string; retryable: boolean }> {
  try {
    const res = await fetch('/api/admin/door/sell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-sale-id': payload.client_sale_id,
      },
      body: JSON.stringify({
        tier_id: payload.tier_id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone,
        qty: payload.qty,
        pay_method: payload.pay_method,
      }),
    });

    const data = (await res.json()) as { error?: string; outcome?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? 'Sale failed',
        retryable: res.status >= 500,
      };
    }

    return { ok: true, data: data as DoorSellResponse };
  } catch {
    return { ok: false, error: 'Network error', retryable: true };
  }
}

export async function drainDoorSaleQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  const queue = readQueue();
  let synced = 0;
  let failed = 0;

  for (const sale of queue) {
    const result = await postDoorSale(sale);
    if (result.ok) {
      removeQueuedSale(sale.client_sale_id);
      synced++;
    } else if (!result.retryable) {
      removeQueuedSale(sale.client_sale_id);
      failed++;
    } else {
      failed++;
    }
  }

  return { synced, failed };
}
