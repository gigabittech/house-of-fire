import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from('tickets')
    .select(`
      id,
      code,
      amount_cents,
      status,
      purchased_at,
      used_at,
      holder_id,
      profiles!tickets_holder_id_fkey (
        id,
        display_name,
        handle,
        avatar_url
      ),
      ticket_tiers!tickets_tier_id_fkey (
        id,
        display_name,
        name
      )
    `)
    .order('purchased_at', { ascending: false });

  if (eventId !== null) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ guests: data ?? [] });
}
