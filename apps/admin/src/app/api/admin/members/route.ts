import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { normalizePagination, parsePagination, parseSort } from '@/lib/pagination';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

const MEMBER_SORT_FIELDS = [
  'member_since',
  'display_name',
  'handle',
  'ticket_count',
  'post_count',
  'last_edition',
] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams);
  const { sort, sortDir } = parseSort(searchParams, MEMBER_SORT_FIELDS, 'member_since');
  const search = searchParams.get('search')?.trim() ?? '';

  const supabase = createAdminSupabaseClient();

  const [listRes, statsRes] = await Promise.all([
    supabase.rpc('admin_list_members', {
      p_page: page,
      p_page_size: pageSize,
      p_search: search || null,
      p_sort: sort,
      p_sort_dir: sortDir,
    }),
    supabase.rpc('admin_members_stats'),
  ]);

  if (listRes.error) {
    return NextResponse.json({ error: listRes.error.message }, { status: 500 });
  }
  if (statsRes.error) {
    return NextResponse.json({ error: statsRes.error.message }, { status: 500 });
  }

  const payload = listRes.data as {
    members?: unknown[];
    pagination?: { page?: number; pageSize?: number; totalCount?: number; totalPages?: number };
  } | null;

  const members = payload?.members ?? [];
  const totalCount = payload?.pagination?.totalCount ?? members.length;

  return NextResponse.json({
    members,
    stats: statsRes.data,
    pagination: normalizePagination(payload?.pagination, page, pageSize, totalCount),
  });
}
