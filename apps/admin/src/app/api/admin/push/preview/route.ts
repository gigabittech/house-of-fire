import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { parsePushSegment, segmentRequiresEvent } from '@hof/push';
import { countSegmentRecipients } from '@/lib/pushCampaign.server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const segment = parsePushSegment(searchParams.get('segment'));
  const eventId = searchParams.get('eventId')?.trim() || null;

  if (!segment) {
    return NextResponse.json({ error: 'Invalid segment' }, { status: 400 });
  }

  if (segmentRequiresEvent(segment) && !eventId) {
    return NextResponse.json({ error: 'eventId is required for this segment' }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const count = await countSegmentRecipients(supabase, segment, eventId);
    return NextResponse.json({ segment, eventId, recipientCount: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
