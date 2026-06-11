import { createServiceRoleClient } from './supabase.server';

export async function notifyPostAuthor(params: {
  authorId: string;
  actorId: string;
  postId: string;
  type: 'reply' | 'react';
  title: string;
  body: string;
}): Promise<void> {
  if (params.authorId === params.actorId) return;

  const supabase = await createServiceRoleClient();
  await supabase.from('notifications').insert({
    user_id: params.authorId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: `/community/${params.postId}`,
  });
}
