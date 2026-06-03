import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

type AdminRole = 'admin' | 'crew';

export async function requireAdminRole(): Promise<
  { ok: true; userId: string; role: AdminRole } | { ok: false; response: NextResponse }
> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'crew')) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true, userId: user.id, role: profile.role as AdminRole };
}
