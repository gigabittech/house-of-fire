import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get('eventId');
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('tickets')
    .select(
      'id, code, status, purchased_at, stripe_charge_id, profiles!tickets_holder_id_fkey(display_name, handle)',
    )
    .order('purchased_at', { ascending: false })
    .limit(20);

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const activity = (data ?? []).map((t) => {
    const name =
      (t.profiles as { display_name?: string; handle?: string } | null)?.display_name ??
      (t.profiles as { handle?: string } | null)?.handle ??
      t.code;
    const isDoor = (t.stripe_charge_id ?? '').startsWith('door-');
    const time = new Date(t.purchased_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return {
      t: time,
      name: isDoor ? `Walk-up · ${name}` : name,
      meta: t.status === 'used' ? 'Scanned in' : isDoor ? 'Door sale' : 'Ticket',
      tone: isDoor ? 'amber' : t.status === 'used' ? 'success' : 'neutral',
      kind: isDoor ? 'sale' : t.status === 'used' ? 'scan' : 'system',
    };
  });

  return NextResponse.json({ activity });
}
