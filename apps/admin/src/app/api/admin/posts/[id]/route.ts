import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as {
    is_pinned?: boolean;
    moderation_status?: 'pending' | 'approved' | 'hidden' | 'draft';
  };

  const updates: Database['public']['Tables']['posts']['Update'] = {};
  if (body.is_pinned !== undefined) updates.is_pinned = body.is_pinned;
  if (body.moderation_status !== undefined) {
    updates.moderation_status = body.moderation_status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select('id, is_pinned, moderation_status')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}
