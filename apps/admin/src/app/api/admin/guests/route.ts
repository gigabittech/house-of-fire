import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ADMIN_GUEST_SELECT, normalizeGuestTicket } from '@/lib/guestTicket';
import { normalizePagination, parsePagination, parseSort } from '@/lib/pagination';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

const GUEST_SORT_FIELDS = ['purchased_at', 'code', 'status', 'amount_cents'] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams);
  const { sort, sortDir } = parseSort(searchParams, GUEST_SORT_FIELDS, 'purchased_at');

  const ticketId = searchParams.get('ticketId')?.trim() || null;
  const eventId = searchParams.get('eventId')?.trim() || null;
  const tierId = searchParams.get('tierId')?.trim() || null;
  const email = searchParams.get('email')?.trim() ?? '';
  const code = searchParams.get('code')?.trim() ?? '';
  const nameSearch =
    searchParams.get('nameSearch')?.trim() ?? searchParams.get('search')?.trim() ?? '';

  const supabase = createAdminSupabaseClient();

  if (ticketId) {
    const { data: row, error: oneError } = await supabase
      .from('tickets')
      .select(ADMIN_GUEST_SELECT)
      .eq('id', ticketId)
      .maybeSingle();

    if (oneError) {
      return NextResponse.json({ error: oneError.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({
        guests: [],
        pagination: normalizePagination(null, 1, 1, 0),
      });
    }

    const guest = normalizeGuestTicket(row as Record<string, unknown>);
    return NextResponse.json({
      guests: [guest],
      pagination: normalizePagination(
        { page: 1, pageSize: 1, totalCount: 1, totalPages: 1 },
        1,
        1,
        1,
      ),
    });
  }

  const { data, error } = await supabase.rpc('admin_list_guests', {
    p_page: page,
    p_page_size: pageSize,
    p_event_id: eventId,
    p_tier_id: tierId && !tierId.startsWith('group:') ? tierId : null,
    p_email: email || null,
    p_code: code || null,
    p_name_search: nameSearch || null,
    p_sort: sort,
    p_sort_dir: sortDir,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload = data as {
    guests?: unknown[];
    pagination?: { page?: number; pageSize?: number; totalCount?: number; totalPages?: number };
  } | null;

  const guests = (payload?.guests ?? []).map((row) =>
    normalizeGuestTicket(row as Record<string, unknown>),
  );
  const totalCount = payload?.pagination?.totalCount ?? guests.length;

  return NextResponse.json({
    guests,
    pagination: normalizePagination(payload?.pagination, page, pageSize, totalCount),
  });
}
