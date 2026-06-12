import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { normalizePagination, parsePagination } from '@/lib/pagination';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams);
  const offset = (page - 1) * pageSize;
  const orderId = searchParams.get('orderId')?.trim() || null;

  const supabase = createAdminSupabaseClient();
  let q = supabase
    .from('email_resend_audit')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (orderId) {
    q = q.eq('order_id', orderId);
  }

  const { data, error, count } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    entries: data ?? [],
    pagination: normalizePagination(null, page, pageSize, count ?? 0),
  });
}
