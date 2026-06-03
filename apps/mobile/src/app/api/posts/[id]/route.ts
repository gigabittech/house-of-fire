import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase.server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [postRes, repliesRes] = await Promise.all([
    supabase
      .from('posts')
      .select('*, profiles!author_id(handle, display_name, role, avatar_url)')
      .eq('id', id)
      .single(),
    supabase
      .from('replies')
      .select('*, profiles!author_id(handle, display_name, role, avatar_url)')
      .eq('post_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (postRes.error || !postRes.data) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  return NextResponse.json({
    post: postRes.data,
    replies: repliesRes.data ?? [],
  });
}
