import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../../lib/supabase.server';

type Emoji = 'fire' | 'eyes' | 'heart' | 'music' | 'pray';
const VALID_EMOJIS: Emoji[] = ['fire', 'eyes', 'heart', 'music', 'pray'];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { emoji?: string };
  const emojiRaw = body.emoji ?? '';

  if (!(VALID_EMOJIS as string[]).includes(emojiRaw)) {
    return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
  }
  const emoji = emojiRaw as Emoji;

  // Check if already reacted
  const { data: existing } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('post_id', id)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .single();

  if (existing) {
    // Toggle off
    await supabase.from('post_reactions').delete().eq('id', existing.id);
  } else {
    // Toggle on
    await supabase.from('post_reactions').insert({ post_id: id, user_id: user.id, emoji });
  }

  // Return fresh counts
  const { data: post } = await supabase
    .from('posts')
    .select('reaction_counts')
    .eq('id', id)
    .single();

  return NextResponse.json({ reactionCounts: post?.reaction_counts, toggled: !existing });
}
