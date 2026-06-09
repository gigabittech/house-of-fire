import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '../../../../lib/supabase.server';

export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // User-scoped session cannot delete under RLS until the delete policy is applied;
  // service role deletes only this user's rows after auth is verified above.
  const admin = await createServiceRoleClient();
  const { error, count } = await admin
    .from('notifications')
    .delete({ count: 'exact' })
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, deleted: count ?? 0 });
}
