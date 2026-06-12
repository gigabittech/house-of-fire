import type { EventPhotoCursor } from './types';

export function parsePhotoCursor(searchParams: URLSearchParams): EventPhotoCursor | null {
  const createdAt = searchParams.get('cursorCreatedAt')?.trim();
  const id = searchParams.get('cursorId')?.trim();
  if (!createdAt || !id) return null;
  return { createdAt, id };
}

export function parsePhotoPageSize(
  searchParams: URLSearchParams,
  fallback = 48,
  max = 100,
): number {
  const raw = searchParams.get('limit') ?? searchParams.get('pageSize');
  if (!raw) return fallback;
  return Math.min(max, Math.max(1, Number.parseInt(raw, 10) || fallback));
}

export function photoCursorFromRow(
  row: { created_at: string; id: string } | null | undefined,
): EventPhotoCursor | null {
  if (!row?.created_at || !row.id) return null;
  return { createdAt: row.created_at, id: row.id };
}

export function appendPhotoCursorParams(url: URL, cursor: EventPhotoCursor | null): void {
  if (!cursor) return;
  url.searchParams.set('cursorCreatedAt', cursor.createdAt);
  url.searchParams.set('cursorId', cursor.id);
}

export function mergePhotosById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const seen = new Set(existing.map((item) => item.id));
  const merged = [...existing];
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}
