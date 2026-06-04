/** Max tickets in a single checkout (global safety cap). */
export const MAX_TICKETS_PER_ORDER = 4;

/** Default when event has no max_tickets_per_user configured. */
export const DEFAULT_MAX_TICKETS_PER_USER_PER_EVENT = 4;

export function clampOrderQuantity(quantity: unknown, maxPerOrder = MAX_TICKETS_PER_ORDER): number {
  const n = typeof quantity === 'number' ? quantity : parseInt(String(quantity ?? '1'), 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(maxPerOrder, Math.max(1, Math.floor(n)));
}

export function effectiveMaxTicketsPerUser(eventMax: number | null | undefined): number {
  const n =
    typeof eventMax === 'number' && Number.isInteger(eventMax) && eventMax >= 1
      ? eventMax
      : DEFAULT_MAX_TICKETS_PER_USER_PER_EVENT;
  return Math.min(n, MAX_TICKETS_PER_ORDER * 5);
}
