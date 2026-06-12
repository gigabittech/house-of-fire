import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { parsePhotoCursor, parsePhotoPageSize } from '@hof/media';
import {
  buildAdminMediaPageResponse,
  countAdminMediaPhotosRpc,
  listAdminMediaPhotosRpc,
} from '@/lib/adminMediaApi.server';
import { applyPhotoStatusChange } from '@/lib/eventPhotoStorage';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

type PhotoStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

const PHOTO_STATUSES: PhotoStatus[] = ['pending', 'approved', 'rejected', 'inactive'];

function escapeIlike(term: string): string {
  return term.replace(/,/g, ' ').replace(/[%_]/g, '\\$&');
}

async function resolveUploaderIds(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  term: string,
): Promise<string[]> {
  const esc = escapeIlike(term);
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .or(`display_name.ilike.%${esc}%,handle.ilike.%${esc}%`);

  if (error) return [];
  return (data ?? []).map((row) => row.id);
}

async function fetchUserEmails(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return map;

  const { data, error } = await supabase.rpc('admin_resolve_user_emails', {
    p_user_ids: uniqueIds,
  });
  if (error || !data) return map;

  for (const [id, email] of Object.entries(data as Record<string, string>)) {
    const trimmed = email?.trim();
    if (trimmed) map.set(id, trimmed);
  }

  return map;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status') ?? 'pending';
  const eventId = searchParams.get('eventId')?.trim() ?? '';
  const search = searchParams.get('search')?.trim() ?? '';
  const email = searchParams.get('email')?.trim().toLowerCase() ?? '';
  const dateFrom = searchParams.get('dateFrom')?.trim() ?? '';
  const dateTo = searchParams.get('dateTo')?.trim() ?? '';
  const cursor = parsePhotoCursor(searchParams);
  const pageSize = parsePhotoPageSize(searchParams, 25, 100);

  const status: PhotoStatus | null =
    statusParam === 'all'
      ? null
      : PHOTO_STATUSES.includes(statusParam as PhotoStatus)
        ? (statusParam as PhotoStatus)
        : 'pending';

  const supabase = createAdminSupabaseClient();

  const uploaderIds = search ? await resolveUploaderIds(supabase, search) : null;
  const filters = {
    status,
    eventId: eventId || null,
    search: search || null,
    uploaderIds: uploaderIds && uploaderIds.length > 0 ? uploaderIds : null,
    email: email || null,
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
  };

  try {
    const [{ photos, hasMore }, totalCount] = await Promise.all([
      listAdminMediaPhotosRpc(supabase, filters, cursor, pageSize),
      cursor ? Promise.resolve(undefined) : countAdminMediaPhotosRpc(supabase, filters),
    ]);

    const profileIds = photos
      .map((row) => row.profiles?.id)
      .filter((id): id is string => Boolean(id));
    const emailByUserId = await fetchUserEmails(supabase, profileIds);

    const enriched = photos.map((row) => ({
      ...row,
      uploader_email: row.profiles?.id ? (emailByUserId.get(row.profiles.id) ?? null) : null,
    }));

    return NextResponse.json(buildAdminMediaPageResponse(enriched, hasMore, totalCount));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load photos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { id: string; status: PhotoStatus };
  const { id, status } = body;

  if (!id || !PHOTO_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: photo, error: fetchError } = await supabase
    .from('event_photos')
    .select('id, event_id, uploader_id, storage_path')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  try {
    await applyPhotoStatusChange(supabase, photo, status);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Status update failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id param' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: photo, error: fetchError } = await supabase
    .from('event_photos')
    .select('id, storage_path')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  if (photo.storage_path) {
    const { error: storageError } = await supabase.storage
      .from('event-photos')
      .remove([photo.storage_path]);
    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }
  }

  const { error: deleteError } = await supabase.from('event_photos').delete().eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
