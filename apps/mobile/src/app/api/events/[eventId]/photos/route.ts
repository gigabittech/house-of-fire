import { type NextRequest, NextResponse } from 'next/server';
import { parsePhotoCursor, parsePhotoPageSize } from '@hof/media';
import {
  buildPhotoPageResponse,
  countEventPhotosRpc,
  listEventPhotosRpc,
} from '../../../../../lib/eventPhotosApi.server';
import { fetchEventBySlug } from '../../../../../lib/resolveEventSlug';
import { createServerSupabaseClient } from '../../../../../lib/supabase.server';

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { eventId: slug } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const cursor = parsePhotoCursor(searchParams);
  const pageSize = parsePhotoPageSize(searchParams, 48, 100);

  const { data: event, error: eventError } = await fetchEventBySlug(supabase, slug);

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  try {
    const [{ photos, hasMore }, totalCount] = await Promise.all([
      listEventPhotosRpc(supabase, event.id, cursor, pageSize),
      cursor ? Promise.resolve(undefined) : countEventPhotosRpc(supabase, event.id),
    ]);

    return NextResponse.json({
      event: cursor ? undefined : event,
      ...buildPhotoPageResponse(photos, hasMore, totalCount),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load photos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
