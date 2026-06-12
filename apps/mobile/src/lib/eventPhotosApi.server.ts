import type { SupabaseClient } from '@supabase/supabase-js';
import { photoCursorFromRow, type EventPhotoCursor, type EventPhotoRow } from '@hof/media';
import { CUSTOMER_VISIBLE_PHOTO_STATUS } from './eventPhotos.server';

type RpcPhotoPage = {
  photos: EventPhotoRow[];
  hasMore: boolean;
};

export async function listEventPhotosRpc(
  supabase: SupabaseClient,
  eventId: string,
  cursor: EventPhotoCursor | null,
  pageSize: number,
  status = CUSTOMER_VISIBLE_PHOTO_STATUS,
): Promise<RpcPhotoPage> {
  const { data, error } = await supabase.rpc('list_event_photos', {
    p_event_id: eventId,
    p_status: status,
    p_cursor_created_at: cursor?.createdAt ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_page_size: pageSize,
  });

  if (error) throw error;

  const payload = (data ?? { photos: [], hasMore: false }) as RpcPhotoPage;
  return {
    photos: payload.photos ?? [],
    hasMore: payload.hasMore ?? false,
  };
}

export async function countEventPhotosRpc(
  supabase: SupabaseClient,
  eventId: string,
  status = CUSTOMER_VISIBLE_PHOTO_STATUS,
): Promise<number> {
  const { data, error } = await supabase.rpc('count_event_photos', {
    p_event_id: eventId,
    p_status: status,
  });

  if (error) throw error;
  return Number(data ?? 0);
}

export function buildPhotoPageResponse(
  photos: EventPhotoRow[],
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
