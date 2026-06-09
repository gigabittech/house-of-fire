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

const CHANNELS = ['general', 'lineup', 'recap', 'help', 'crew'] as const;
type Channel = (typeof CHANNELS)[number];

const MODERATION_STATUSES = ['pending', 'approved', 'rejected', 'hidden', 'draft'] as const;
type ModerationStatus = (typeof MODERATION_STATUSES)[number];

const postSelect = `
  id,
  channel,
  title,
  body,
  is_pinned,
  is_anonymous,
  moderation_status,
  moderation_note,
  reply_count,
  created_at,
  profiles!posts_author_id_fkey (
    handle,
    display_name
  )
`;

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const supabase = createAdminSupabaseClient();
  const { searchParams } = new URL(request.url);

  const page = asInt(searchParams.get('page'), 1);
  const limit = clamp(asInt(searchParams.get('limit'), 25), 1, 100);
  const offset = (page - 1) * limit;

  const statusRaw = searchParams.get('status')?.trim() ?? '';
  const channelRaw = searchParams.get('channel')?.trim() ?? '';
  const search = searchParams.get('search')?.trim() ?? '';
  const dateFrom = searchParams.get('dateFrom')?.trim() ?? '';
  const dateTo = searchParams.get('dateTo')?.trim() ?? '';

  const status = MODERATION_STATUSES.includes(statusRaw as ModerationStatus)
    ? (statusRaw as ModerationStatus)
    : '';
  const channel = CHANNELS.includes(channelRaw as Channel) ? (channelRaw as Channel) : '';

  let query = supabase
    .from('posts')
    .select(postSelect, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status) query = query.eq('moderation_status', status);
  if (channel) query = query.eq('channel', channel);
  if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`);
  if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59.999Z`);

  if (search) {
    const esc = search.replace(/,/g, ' ');
    query = query.or(`title.ilike.%${esc}%,body.ilike.%${esc}%`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return NextResponse.json({
    data: data ?? [],
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
