/** Max tickets in a single checkout. */
export const MAX_TICKETS_PER_ORDER = 4;

/** Max tickets one account may hold per event (across orders). */
export const MAX_TICKETS_PER_USER_PER_EVENT = 4;

export function clampOrderQuantity(quantity: unknown): number {
  const n = typeof quantity === 'number' ? quantity : parseInt(String(quantity ?? '1'), 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_TICKETS_PER_ORDER, Math.max(1, Math.floor(n)));
}
