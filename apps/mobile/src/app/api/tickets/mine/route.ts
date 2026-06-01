import { NextResponse } from 'next/server.js';
import { createServerSupabaseClient } from '../../../../lib/supabase.server.js';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*, events(*), ticket_tiers(*)')
    .eq('holder_id', user.id)
    .order('purchased_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tickets: tickets ?? [] });
}
