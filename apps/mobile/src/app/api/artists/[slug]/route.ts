import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase.server';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: artist, error } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error ?? !artist) {
    return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
  }
  return NextResponse.json({ artist });
}
