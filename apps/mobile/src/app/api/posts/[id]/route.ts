import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase.server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post, error } = await supabase
    .from('posts')
    .select('*, profiles!author_id(handle, display_name, role, avatar_url)')
    .eq('id', id)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const isAuthor = user?.id === post.author_id;
  const isApproved = post.moderation_status === 'approved';

  if (!isApproved && !isAuthor) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  let myReactions: string[] = [];
  if (user) {
    const { data: reactions } = await supabase
      .from('post_reactions')
      .select('emoji')
      .eq('post_id', id)
      .eq('user_id', user.id);
    myReactions = (reactions ?? []).map((reaction) => reaction.emoji);
  }

  return NextResponse.json({
    post,
    myReactions,
  });
}
