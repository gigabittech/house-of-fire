import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin.js';

export async function GET() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('edition_number', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data ?? [] });
}
