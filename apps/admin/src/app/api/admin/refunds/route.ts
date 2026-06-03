import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('refund_requests')
    .select(`
      id,
      reason,
      status,
      created_at,
      tickets ( code, amount_cents ),
      profiles!refund_requests_user_id_fkey ( display_name, handle )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pending = (data ?? []).filter((r) => r.status === 'pending');

  return NextResponse.json({ refunds: data ?? [], pending });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    id: string;
    status: 'approved' | 'rejected';
  };

  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from('refund_requests')
    .update({ status: body.status })
    .eq('id', body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
