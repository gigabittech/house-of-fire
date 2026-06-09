import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type ModerationAction = 'approved' | 'rejected' | 'hidden' | 'deleted' | 'pinned' | 'unpinned';

type AdminClient = SupabaseClient<Database>;

interface ApplyModerationParams {
  supabase: AdminClient;
  postId: string;
  moderatorId: string;
  action: ModerationAction;
  reason?: string;
}

export async function applyModerationAction({
  supabase,
  postId,
  moderatorId,
  action,
  reason,
}: ApplyModerationParams): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('id, author_id, title, body, channel, moderation_status')
    .eq('id', postId)
    .single();

  if (fetchError || !post) {
    return { ok: false, error: fetchError?.message ?? 'Post not found' };
  }

  if (action === 'deleted') {
    await supabase.from('moderation_actions').insert({
      post_id: postId,
      moderator_id: moderatorId,
      action,
      reason: reason ?? null,
    });

    if (post.author_id) {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        type: 'post_rejected',
        title: 'Post removed',
        body: reason?.trim() || 'Your post was removed by moderation.',
        link: null,
      });
    }

    const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId);
    if (deleteError) return { ok: false, error: deleteError.message };
    return { ok: true };
  }

  const updates: Database['public']['Tables']['posts']['Update'] = {};

  if (action === 'approved') {
    updates.moderation_status = 'approved';
    updates.moderation_note = null;
  } else if (action === 'rejected') {
    updates.moderation_status = 'rejected';
    updates.moderation_note = reason?.trim() || null;
  } else if (action === 'hidden') {
    updates.moderation_status = 'hidden';
    updates.moderation_note = reason?.trim() || null;
  } else if (action === 'pinned') {
    updates.is_pinned = true;
  } else if (action === 'unpinned') {
    updates.is_pinned = false;
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase.from('posts').update(updates).eq('id', postId);
    if (updateError) return { ok: false, error: updateError.message };
  }

  await supabase.from('moderation_actions').insert({
    post_id: postId,
    moderator_id: moderatorId,
    action,
    reason: reason ?? null,
  });

  if (post.author_id && (action === 'approved' || action === 'rejected' || action === 'hidden')) {
    const preview = (post.body ?? post.title ?? 'your post').slice(0, 80);
    if (action === 'approved') {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        type: 'post_approved',
        title: 'Post approved',
        body: preview,
        link: `/community/${postId}`,
      });
    } else {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        type: 'post_rejected',
        title: action === 'hidden' ? 'Post hidden' : 'Post not approved',
        body: reason?.trim() || preview,
        link: null,
      });
    }
  }

  return { ok: true };
}

export async function enforcePinLimit(
  supabase: AdminClient,
  postId: string,
  channel: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { count, error } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('channel', channel as Database['public']['Tables']['posts']['Row']['channel'])
    .eq('is_pinned', true)
    .neq('id', postId);

  if (error) return { ok: false, error: error.message };
  if ((count ?? 0) >= 3) {
    return { ok: false, error: 'Max 3 pinned posts per channel' };
  }
  return { ok: true };
}
