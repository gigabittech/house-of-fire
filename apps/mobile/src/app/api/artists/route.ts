import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('artists')
    .select('id, slug, name, genre, bio, image_url, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ artists: data ?? [] });
}
