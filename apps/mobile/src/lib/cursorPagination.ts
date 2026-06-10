export type FeedCursor = {
  createdAt: string;
  id: string;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: FeedCursor | null;
  hasMore: boolean;
};

export function parseFeedCursor(searchParams: URLSearchParams): FeedCursor | null {
  const createdAt = searchParams.get('cursorCreatedAt')?.trim();
  const id = searchParams.get('cursorId')?.trim();
  if (!createdAt || !id) return null;
  return { createdAt, id };
}

export function parsePageSize(
  searchParams: URLSearchParams,
  fallback = 20,
  max = 50,
): number {
  const raw = searchParams.get('limit') ?? searchParams.get('pageSize');
  if (!raw) return fallback;
  return Math.min(max, Math.max(1, Number.parseInt(raw, 10) || fallback));
}

export function cursorFromRow(row: { created_at: string; id: string } | null | undefined): FeedCursor | null {
  if (!row?.created_at || !row.id) return null;
  return { createdAt: row.created_at, id: row.id };
}

export function appendCursorParams(url: URL, cursor: FeedCursor | null): void {
  if (!cursor) return;
  url.searchParams.set('cursorCreatedAt', cursor.createdAt);
  url.searchParams.set('cursorId', cursor.id);
}

export function mergeUniqueById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const seen = new Set(existing.map((item) => item.id));
  const merged = [...existing];
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}

export function prependUniqueById<T extends { id: string }>(existing: T[], item: T): T[] {
  if (existing.some((row) => row.id === item.id)) return existing;
  return [item, ...existing];
}
