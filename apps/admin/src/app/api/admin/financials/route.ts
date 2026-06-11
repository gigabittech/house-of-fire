import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { normalizePagination, parsePagination, parseSort } from '@/lib/pagination';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

const FINANCIAL_SORT_FIELDS = [
  'edition_number',
  'name',
  'date',
  'gross_cents',
  'ticket_count',
] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams);
  const { sort, sortDir } = parseSort(searchParams, FINANCIAL_SORT_FIELDS, 'edition_number');
  const search = searchParams.get('search')?.trim() ?? '';

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.rpc('admin_financials_list', {
    p_page: page,
    p_page_size: pageSize,
    p_search: search || null,
    p_sort: sort,
    p_sort_dir: sortDir,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload = data as {
    financials?: unknown[];
    totals?: { gross_cents?: number; ticket_count?: number };
    pagination?: { page?: number; pageSize?: number; totalCount?: number; totalPages?: number };
  } | null;

  const financials = payload?.financials ?? [];
  const totalCount = payload?.pagination?.totalCount ?? financials.length;

  return NextResponse.json({
    financials,
    totals: payload?.totals ?? { gross_cents: 0, ticket_count: 0 },
    pagination: normalizePagination(payload?.pagination, page, pageSize, totalCount),
  });
}
