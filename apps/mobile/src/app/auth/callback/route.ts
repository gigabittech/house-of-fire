import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers.js';
import { type NextRequest, NextResponse } from 'next/server.js';
import type { Database } from '../../../lib/database.types.js';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash') ?? searchParams.get('token');
  const type = searchParams.get('type');
  const nextRaw = searchParams.get('next') ?? '/';
  const next =
    nextRaw.startsWith('/') && !nextRaw.startsWith('//') && nextRaw !== '/landing'
      ? nextRaw
      : '/';
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  if (code || (tokenHash && type) || (accessToken && refreshToken)) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            /* ignore in server components */
          }
        },
      },
    });

    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : accessToken && refreshToken
        ? await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        : await supabase.auth.verifyOtp({
            token_hash: tokenHash as string,
            type: type as Parameters<typeof supabase.auth.verifyOtp>[0]['type'],
          });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to error page or landing
  return NextResponse.redirect(`${origin}/landing?error=auth`);
}
