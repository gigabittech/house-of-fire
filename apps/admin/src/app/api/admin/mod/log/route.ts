import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('moderation_actions')
    .select(`
      id,
      action,
      reason,
      created_at,
      post:posts ( id, title, channel ),
      moderator:profiles!moderation_actions_moderator_id_fkey ( handle, display_name )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ actions: data ?? [] });
}
