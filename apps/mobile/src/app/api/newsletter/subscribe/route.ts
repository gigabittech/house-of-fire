import { NextResponse, type NextRequest } from 'next/server.js';
import { createServerSupabaseClient } from '../../../../lib/supabase.server.js';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  // Use the server client; newsletter_subscribers has an open insert policy
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email, source: 'website' });

  if (error) {
    // 23505 = unique_violation (already subscribed)
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
