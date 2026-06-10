import { type NextRequest, NextResponse } from 'next/server';
import { buildFeedResponse, listAuthorPostsRpc } from '../../../../lib/communityApi.server';
import { parseFeedCursor, parsePageSize } from '../../../../lib/cursorPagination';
import { createServerSupabaseClient } from '../../../../lib/supabase.server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cursor = parseFeedCursor(searchParams);
  const pageSize = parsePageSize(searchParams, 20, 50);

  try {
    const { posts, hasMore } = await listAuthorPostsRpc(supabase, user.id, cursor, pageSize);
    return NextResponse.json(buildFeedResponse(posts, hasMore));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load posts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
