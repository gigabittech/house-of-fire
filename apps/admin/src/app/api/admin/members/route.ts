import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin.js';

export async function GET() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('member_since', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: data ?? [] });
}
