import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

function asInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

type EmailLogRow = {
  id: string;
  created_at: string;
  sent_at: string | null;
  status: 'queued' | 'sent' | 'failed';
  provider: string;
  provider_message_id: string | null;
  app: 'mobile' | 'admin';
  kind: string | null;
  project_id: string | null;
  to_address: string;
  subject: string;
  text_body: string | null;
  html_body: string | null;
  from_email: string | null;
  reply_to: string | null;
  error_message: string | null;
  meta: unknown | null;
};

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const supabase = createAdminSupabaseClient();
  const { searchParams } = new URL(request.url);

  const page = asInt(searchParams.get('page'), 1);
  const limit = clamp(asInt(searchParams.get('limit'), 25), 1, 100);
  const offset = (page - 1) * limit;

  const statusRaw = searchParams.get('status')?.trim() ?? '';
  const appRaw = searchParams.get('app')?.trim() ?? '';
  const kind = searchParams.get('kind')?.trim() ?? '';
  const projectId = searchParams.get('projectId')?.trim() ?? '';
  const search = searchParams.get('search')?.trim() ?? '';
  const dateFrom = searchParams.get('dateFrom')?.trim() ?? '';
  const dateTo = searchParams.get('dateTo')?.trim() ?? '';

  const status =
    statusRaw === 'queued' || statusRaw === 'sent' || statusRaw === 'failed' ? statusRaw : '';
  const app = appRaw === 'mobile' || appRaw === 'admin' ? appRaw : '';

  let query = supabase
    .from('email_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (app) query = query.eq('app', app);
  if (kind) query = query.eq('kind', kind);
  if (projectId) query = query.eq('project_id', projectId);

  if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`);
  if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59.999Z`);

  if (search) {
    const esc = search.replace(/,/g, ' ');
    query = query.or(
      [
        `subject.ilike.%${esc}%`,
        `to_address.ilike.%${esc}%`,
        `text_body.ilike.%${esc}%`,
        `error_message.ilike.%${esc}%`,
      ].join(','),
    );
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return NextResponse.json({
    data: (data ?? []) as EmailLogRow[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}
