import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export type TierStatusRow = {
  tier_id: string;
  name: string;
  display_name: string;
  capacity: number;
  sold: number;
  remaining: number;
  tier_status: string;
};

export type EventTierStatusGroup = {
  event_id: string;
  edition_number: number;
  name: string;
  status: string;
  tiers: TierStatusRow[];
};

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const eventId = request.nextUrl.searchParams.get('eventId')?.trim() || null;
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.rpc('admin_guests_tier_status', {
    p_event_id: eventId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: (data ?? []) as EventTierStatusGroup[] });
}
