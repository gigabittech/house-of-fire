import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET() {
  const supabase = createAdminSupabaseClient();

  const { count: mediaPending, error: mediaError } = await supabase
    .from('event_photos')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (mediaError) {
    return NextResponse.json({ error: mediaError.message }, { status: 500 });
  }

  let modPending = 0;
  const { count: modCount, error: modError } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('moderation_status', 'pending');

  if (!modError) {
    modPending = modCount ?? 0;
  }

  let reportsOpen = 0;
  const { count: reportCount, error: reportError } = await supabase
    .from('content_reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');

  if (!reportError) {
    reportsOpen = reportCount ?? 0;
  }

  return NextResponse.json({
    mediaPending: mediaPending ?? 0,
    modPending: modPending + reportsOpen,
  });
}
