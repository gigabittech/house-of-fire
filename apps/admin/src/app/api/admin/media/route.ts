import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { applyPhotoStatusChange } from '@/lib/eventPhotoStorage';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

type PhotoStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

const PHOTO_STATUSES: PhotoStatus[] = ['pending', 'approved', 'rejected', 'inactive'];

function asInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

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

  await Promise.all(
    uniqueIds.map(async (id) => {
      const { data } = await supabase.auth.admin.getUserById(id);
      const email = data?.user?.email?.trim();
      if (email) map.set(id, email);
    }),
  );

  return map;
}

const EMAIL_FILTER_FETCH_CAP = 500;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status') ?? 'pending';
  const eventId = searchParams.get('eventId')?.trim() ?? '';
  const search = searchParams.get('search')?.trim() ?? '';
  const email = searchParams.get('email')?.trim().toLowerCase() ?? '';
  const dateFrom = searchParams.get('dateFrom')?.trim() ?? '';
  const dateTo = searchParams.get('dateTo')?.trim() ?? '';
  const page = asInt(searchParams.get('page'), 1);
  const limit = clamp(asInt(searchParams.get('limit'), 25), 1, 100);
  const offset = (page - 1) * limit;

  const status: PhotoStatus | null =
    statusParam === 'all'
      ? null
      : PHOTO_STATUSES.includes(statusParam as PhotoStatus)
        ? (statusParam as PhotoStatus)
        : 'pending';

  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from('event_photos')
    .select(
      `
      id,
      event_id,
      storage_path,
      public_url,
      caption,
      status,
      created_at,
      events!event_photos_event_id_fkey (
        edition_number,
        name
      ),
      profiles!event_photos_uploader_id_fkey (
        id,
        handle,
        display_name,
        avatar_url
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (eventId) {
    query = query.eq('event_id', eventId);
  }
  if (dateFrom) {
    query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`);
  }
  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59.999Z`);
  }

  if (search) {
    const esc = escapeIlike(search);
    const uploaderIds = await resolveUploaderIds(supabase, search);
    const orParts = [`caption.ilike.%${esc}%`, `storage_path.ilike.%${esc}%`];
    if (uploaderIds.length > 0) {
      orParts.push(`uploader_id.in.(${uploaderIds.join(',')})`);
    }
    query = query.or(orParts.join(','));
  }

  const useEmailFilter = email.length > 0;

  const { data, error, count } = useEmailFilter
    ? await query.limit(EMAIL_FILTER_FETCH_CAP)
    : await query.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const uploaderIds = rows
    .map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return profile && typeof profile === 'object' && 'id' in profile
        ? (profile as { id: string }).id
        : null;
    })
    .filter((id): id is string => Boolean(id));

  const emailByUserId = await fetchUserEmails(supabase, uploaderIds);

  let photos = rows.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const profileId =
      profile && typeof profile === 'object' && 'id' in profile
        ? (profile as { id: string }).id
        : null;

    return {
      ...row,
      uploader_email: profileId ? (emailByUserId.get(profileId) ?? null) : null,
    };
  });

  if (useEmailFilter) {
    photos = photos.filter((row) => row.uploader_email?.toLowerCase().includes(email));
  }

  const total = useEmailFilter ? photos.length : (count ?? 0);
  const paginatedPhotos = useEmailFilter
    ? photos.slice(offset, offset + limit)
    : photos;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return NextResponse.json({
    photos: paginatedPhotos,
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
