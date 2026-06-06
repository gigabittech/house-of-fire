import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const supabase = createAdminSupabaseClient();
  const { searchParams } = new URL(request.url);

  const statusRaw = searchParams.get('status')?.trim() ?? '';
  const appRaw = searchParams.get('app')?.trim() ?? '';
  const kind = searchParams.get('kind')?.trim() ?? '';
  const projectId = searchParams.get('projectId')?.trim() ?? '';
  const dateFrom = searchParams.get('dateFrom')?.trim() ?? '';
  const dateTo = searchParams.get('dateTo')?.trim() ?? '';

  const status =
    statusRaw === 'queued' || statusRaw === 'sent' || statusRaw === 'failed' ? statusRaw : '';
  const app = appRaw === 'mobile' || appRaw === 'admin' ? appRaw : '';

  // Default to last 30 days (UTC) if no date range provided.
  const now = new Date();
  const from =
    dateFrom?.length > 0
      ? new Date(`${dateFrom}T00:00:00.000Z`)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const to =
    dateTo?.length > 0 ? new Date(`${dateTo}T23:59:59.999Z`) : new Date(now.getTime());

  function baseQuery() {
    let q = supabase.from('email_logs').select('id', { count: 'exact', head: true });
    q = q.gte('created_at', from.toISOString()).lte('created_at', to.toISOString());
    if (status) q = q.eq('status', status);
    if (app) q = q.eq('app', app);
    if (kind) q = q.eq('kind', kind);
    if (projectId) q = q.eq('project_id', projectId);
    return q;
  }

  const [{ count: total }, { count: sent }, { count: failed }, { count: queued }] = await Promise.all(
    [
      baseQuery(),
      baseQuery().eq('status', 'sent'),
      baseQuery().eq('status', 'failed'),
      baseQuery().eq('status', 'queued'),
    ],
  );

  const sentN = sent ?? 0;
  const failedN = failed ?? 0;
  const queuedN = queued ?? 0;
  const denom = sentN + failedN;
  const deliveryPct = denom > 0 ? Math.round((sentN / denom) * 100) : 0;

  return NextResponse.json({
    total: total ?? 0,
    sent30d: sentN,
    failed: failedN,
    inQueue: queuedN,
    deliveryPct,
    dateFrom: from.toISOString(),
    dateTo: to.toISOString(),
  });
}

