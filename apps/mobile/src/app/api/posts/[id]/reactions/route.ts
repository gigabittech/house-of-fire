import { type NextRequest, NextResponse } from 'next/server';
import { notifyPostAuthor } from '../../../../../lib/postNotifications.server';
import { createServerSupabaseClient } from '../../../../../lib/supabase.server';

type Emoji = 'fire' | 'eyes' | 'heart' | 'music' | 'pray';
const VALID_EMOJIS: Emoji[] = ['fire', 'eyes', 'heart', 'music', 'pray'];

const REACTION_GLYPH: Record<Emoji, string> = {
  fire: '🔥',
  eyes: '👀',
  heart: '❤️',
  music: '🎶',
  pray: '🙏',
};

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

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('author_id, title, body, reaction_counts')
    .eq('id', id)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from('post_reactions')
    .select('id, emoji')
    .eq('post_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  let myReaction: Emoji | null = null;
  let removed = false;

  if (existing?.emoji === emoji) {
    await supabase.from('post_reactions').delete().eq('id', existing.id);
    removed = true;
  } else if (existing) {
    await supabase.from('post_reactions').update({ emoji }).eq('id', existing.id);
    myReaction = emoji;
  } else {
    await supabase.from('post_reactions').insert({ post_id: id, user_id: user.id, emoji });
    myReaction = emoji;
  }

  if (myReaction) {
    const { data: reactor } = await supabase
      .from('profiles')
      .select('display_name, handle')
      .eq('id', user.id)
      .single();

    const reactorName = reactor?.display_name ?? reactor?.handle ?? 'Someone';
    const preview = (post.body ?? post.title ?? 'your post').slice(0, 80);

    await notifyPostAuthor({
      authorId: post.author_id,
      actorId: user.id,
      postId: id,
      type: 'react',
      title: reactorName,
      body: `${REACTION_GLYPH[myReaction]} · ${preview}`,
    });
  }

  const { data: refreshed } = await supabase
    .from('posts')
    .select('reaction_counts')
    .eq('id', id)
    .single();

  return NextResponse.json({
    reactionCounts: refreshed?.reaction_counts ?? post.reaction_counts,
    myReaction,
    removed,
  });
}
