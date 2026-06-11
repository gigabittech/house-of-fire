import { type NextRequest, NextResponse } from 'next/server';
import { parsePhotoCursor, parsePhotoPageSize } from '@hof/media';
import {
  buildPhotoPageResponse,
  countEventPhotosRpc,
  listEventPhotosRpc,
} from '../../../../../lib/eventPhotosApi.server';
import { createServerSupabaseClient } from '../../../../../lib/supabase.server';

interface RouteContext {
  params: Promise<{ edition: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { edition: editionRaw } = await context.params;
  const edition = Number(editionRaw);

  if (!Number.isInteger(edition) || edition < 1) {
    return NextResponse.json({ error: 'Invalid edition' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const cursor = parsePhotoCursor(searchParams);
  const pageSize = parsePhotoPageSize(searchParams, 48, 100);

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, edition_number, name, date, venue_name, status')
    .eq('edition_number', edition)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  try {
    const [{ photos, hasMore }, totalCount] = await Promise.all([
      listEventPhotosRpc(supabase, event.id, cursor, pageSize),
      cursor ? Promise.resolve(undefined) : countEventPhotosRpc(supabase, event.id),
    ]);

    return NextResponse.json({
      event: cursor
        ? undefined
        : {
            edition_number: event.edition_number,
            name: event.name,
            date: event.date,
            venue_name: event.venue_name,
            status: event.status,
          },
      ...buildPhotoPageResponse(photos, hasMore, totalCount),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load photos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
