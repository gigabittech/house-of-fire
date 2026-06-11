import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

export type GoogleAuthFlow = 'sign_in' | 'sign_up';

export function sanitizeAuthNext(nextRaw: string): string {
  const next = nextRaw.trim() || '/';
  if (!next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}

/** Build the Supabase OAuth redirect URL (callback client handles session exchange). */
export function buildAuthCallbackUrl(params: {
  origin: string;
  next: string;
  flow?: GoogleAuthFlow;
}): string {
  const origin = params.origin.replace(/\/$/, '');
  const search = new URLSearchParams({ next: sanitizeAuthNext(params.next) });
  if (params.flow) search.set('flow', params.flow);
  return `${origin}/auth/callback/client?${search.toString()}`;
}

export function displayNameFromGoogleMetadata(
  metadata: Record<string, unknown> | undefined,
  email?: string | null,
): string {
  if (!metadata) return email?.split('@')[0] ?? 'Member';
  const candidates = [
    metadata.display_name,
    metadata.full_name,
    metadata.name,
    metadata.preferred_username,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  const given = metadata.given_name;
  const family = metadata.family_name;
  if (typeof given === 'string' && given.trim()) {
    const full = [given.trim(), typeof family === 'string' ? family.trim() : '']
      .filter(Boolean)
      .join(' ');
    if (full) return full;
  }
  return email?.split('@')[0] ?? 'Member';
}

export function avatarUrlFromGoogleMetadata(
  metadata: Record<string, unknown> | undefined,
): string | null {
  if (!metadata) return null;
  const candidates = [metadata.avatar_url, metadata.picture];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export async function signInWithGoogle(params: {
  supabase: SupabaseClient<Database>;
  origin: string;
  flow: GoogleAuthFlow;
  next: string;
}): Promise<{ error: string | null }> {
  const redirectTo = buildAuthCallbackUrl({
    origin: params.origin,
    next: params.next,
    flow: params.flow,
  });

  const { error } = await params.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'online',
        prompt: params.flow === 'sign_in' ? 'select_account' : 'consent',
      },
    },
  });

  return { error: error?.message ?? null };
}
