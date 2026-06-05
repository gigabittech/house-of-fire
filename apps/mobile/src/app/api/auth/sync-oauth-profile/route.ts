import { type NextResponse as NextResponseType, NextResponse } from 'next/server';
import {
  avatarUrlFromGoogleMetadata,
  displayNameFromGoogleMetadata,
} from '../../../../lib/auth/googleOAuth';
import { createServerSupabaseClient } from '../../../../lib/supabase.server';

/** Sync Google OAuth identity fields into `profiles` after first sign-in. */
export async function POST(): Promise<NextResponseType> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName = displayNameFromGoogleMetadata(metadata, user.email);
  const avatarUrl = avatarUrlFromGoogleMetadata(metadata);

  const { data: profile, error: readErr } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 500 });
  }

  const updates: { display_name?: string; avatar_url?: string } = {};
  const currentName = profile?.display_name?.trim() ?? '';
  const emailPrefix = user.email?.split('@')[0] ?? '';

  if (!currentName || currentName === emailPrefix || currentName === 'user') {
    updates.display_name = displayName;
  }
  if (avatarUrl && !profile?.avatar_url) {
    updates.avatar_url = avatarUrl;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, updated: false });
  }

  const { error: updateErr } = await supabase.from('profiles').update(updates).eq('id', user.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated: true });
}
