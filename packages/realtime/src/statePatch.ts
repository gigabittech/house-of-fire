/** Immutable array helpers for realtime INSERT / UPDATE / DELETE. */

export function upsertById<T extends { id: string }>(rows: T[], row: T): T[] {
  const idx = rows.findIndex((r) => r.id === row.id);
  if (idx === -1) return [row, ...rows];
  const next = rows.slice();
  next[idx] = { ...rows[idx], ...row };
  return next;
}

export function updateById<T extends { id: string }>(
  rows: T[],
  id: string,
  patch: Partial<T>,
): T[] {
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return rows;
  const next = rows.slice();
  next[idx] = { ...rows[idx]!, ...patch } as T;
  return next;
}

export function removeById<T extends { id: string }>(rows: T[], id: string): T[] {
  return rows.filter((r) => r.id !== id);
}

export function clampCount(n: number): number {
  return Math.max(0, n);
}
