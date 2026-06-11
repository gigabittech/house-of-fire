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
  const to = dateTo?.length > 0 ? new Date(`${dateTo}T23:59:59.999Z`) : new Date(now.getTime());

  const { data: stats, error: statsError } = await supabase.rpc('admin_email_log_stats', {
    p_date_from: from.toISOString(),
    p_date_to: to.toISOString(),
    p_status: status || null,
    p_app: app || null,
    p_kind: kind || null,
    p_project_id: projectId || null,
  });

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  const payload = (stats ?? { total: 0, sent: 0, failed: 0, queued: 0 }) as {
    total?: number;
    sent?: number;
    failed?: number;
    queued?: number;
  };

  const sentN = payload.sent ?? 0;
  const failedN = payload.failed ?? 0;
  const queuedN = payload.queued ?? 0;
  const denom = sentN + failedN;
  const deliveryPct = denom > 0 ? Math.round((sentN / denom) * 100) : 0;

  return NextResponse.json({
    total: payload.total ?? 0,
    sent30d: sentN,
    failed: failedN,
    inQueue: queuedN,
    deliveryPct,
    dateFrom: from.toISOString(),
    dateTo: to.toISOString(),
  });
}
