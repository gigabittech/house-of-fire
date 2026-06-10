export type ApiPagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export function parsePagination(
  searchParams: URLSearchParams,
  defaults?: { pageSize?: number },
): { page: number; pageSize: number } {
  const pageRaw = searchParams.get('page');
  const sizeRaw =
    searchParams.get('pageSize') ?? searchParams.get('limit') ?? String(defaults?.pageSize ?? 25);

  const page = Math.max(1, Number.parseInt(pageRaw ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(sizeRaw, 10) || defaults?.pageSize || 25));

  return { page, pageSize };
}

export function parseSort(
  searchParams: URLSearchParams,
  allowed: readonly string[],
  fallback: string,
): { sort: string; sortDir: 'asc' | 'desc' } {
  const raw = searchParams.get('sort')?.trim() ?? fallback;
  const sort = allowed.includes(raw) ? raw : fallback;
  const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';
  return { sort, sortDir };
}

export function normalizePagination(
  raw: Partial<ApiPagination> | null | undefined,
  page: number,
  pageSize: number,
  totalCount: number,
): ApiPagination {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return {
    page: raw?.page ?? page,
    pageSize: raw?.pageSize ?? pageSize,
    totalCount: raw?.totalCount ?? totalCount,
    totalPages: raw?.totalPages ?? totalPages,
  };
}
