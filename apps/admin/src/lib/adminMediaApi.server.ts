import type { SupabaseClient } from '@supabase/supabase-js';
import { photoCursorFromRow, type EventPhotoCursor } from '@hof/media';

export type AdminMediaPhotoRow = {
  id: string;
  event_id: string;
  storage_path: string;
  public_url: string | null;
  caption: string | null;
  status: string;
  created_at: string;
  events: { edition_number: number; name: string } | null;
  profiles: {
    id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

type RpcAdminPhotoPage = {
  photos: AdminMediaPhotoRow[];
  hasMore: boolean;
};

export type AdminMediaFilters = {
  status: string | null;
  eventId: string | null;
  search: string | null;
  uploaderIds: string[] | null;
  email: string | null;
  dateFrom: string | null;
  dateTo: string | null;
};

export async function listAdminMediaPhotosRpc(
  supabase: SupabaseClient,
  filters: AdminMediaFilters,
  cursor: EventPhotoCursor | null,
  pageSize: number,
): Promise<RpcAdminPhotoPage> {
  const { data, error } = await supabase.rpc('list_admin_media_photos', {
    p_status: filters.status,
    p_event_id: filters.eventId,
    p_search: filters.search,
    p_uploader_ids: filters.uploaderIds,
    p_email: filters.email,
    p_date_from: filters.dateFrom ? `${filters.dateFrom}T00:00:00.000Z` : null,
    p_date_to: filters.dateTo ? `${filters.dateTo}T23:59:59.999Z` : null,
    p_cursor_created_at: cursor?.createdAt ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_page_size: pageSize,
  });

  if (error) throw error;

  const payload = (data ?? { photos: [], hasMore: false }) as RpcAdminPhotoPage;
  return {
    photos: payload.photos ?? [],
    hasMore: payload.hasMore ?? false,
  };
}

export async function countAdminMediaPhotosRpc(
  supabase: SupabaseClient,
  filters: AdminMediaFilters,
): Promise<number> {
  const { data, error } = await supabase.rpc('count_admin_media_photos', {
    p_status: filters.status,
    p_event_id: filters.eventId,
    p_search: filters.search,
    p_uploader_ids: filters.uploaderIds,
    p_email: filters.email,
    p_date_from: filters.dateFrom ? `${filters.dateFrom}T00:00:00.000Z` : null,
    p_date_to: filters.dateTo ? `${filters.dateTo}T23:59:59.999Z` : null,
  });

  if (error) throw error;
  return Number(data ?? 0);
}

export function buildAdminMediaPageResponse(
  photos: AdminMediaPhotoRow[],
  hasMore: boolean,
  totalCount?: number,
) {
  const nextCursor = hasMore ? photoCursorFromRow(photos[photos.length - 1]) : null;
  return {
    photos,
    hasMore,
    nextCursor,
    totalCount,
  };
}
