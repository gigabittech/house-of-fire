import { describe, expect, it } from 'vitest';
import {
  appendCursorParams,
  cursorFromRow,
  mergeUniqueById,
  parseFeedCursor,
  parsePageSize,
  prependUniqueById,
} from './cursorPagination';

describe('cursorPagination', () => {
  it('parses feed cursor from search params', () => {
    const params = new URLSearchParams({
      cursorCreatedAt: '2026-01-01T00:00:00.000Z',
      cursorId: 'post-1',
    });
    expect(parseFeedCursor(params)).toEqual({
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 'post-1',
    });
  });

  it('returns null when cursor params are incomplete', () => {
    expect(parseFeedCursor(new URLSearchParams({ cursorId: 'post-1' }))).toBeNull();
  });

  it('parses page size with bounds', () => {
    expect(parsePageSize(new URLSearchParams({ limit: '99' }), 20, 50)).toBe(50);
    expect(parsePageSize(new URLSearchParams({ limit: '0' }), 20, 50)).toBe(20);
  });

  it('builds cursor from row', () => {
    expect(cursorFromRow({ created_at: '2026-01-02T00:00:00.000Z', id: 'abc' })).toEqual({
      createdAt: '2026-01-02T00:00:00.000Z',
      id: 'abc',
    });
  });

  it('appends cursor params to url', () => {
    const url = new URL('https://example.com/api/posts');
    appendCursorParams(url, { createdAt: '2026-01-01T00:00:00.000Z', id: 'post-1' });
    expect(url.searchParams.get('cursorCreatedAt')).toBe('2026-01-01T00:00:00.000Z');
    expect(url.searchParams.get('cursorId')).toBe('post-1');
  });

  it('merges arrays without duplicate ids', () => {
    const merged = mergeUniqueById([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }]);
    expect(merged.map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });

  it('prepends unique rows', () => {
    expect(prependUniqueById([{ id: 'a' }], { id: 'b' }).map((row) => row.id)).toEqual(['b', 'a']);
    expect(prependUniqueById([{ id: 'a' }], { id: 'a' }).map((row) => row.id)).toEqual(['a']);
  });
});
