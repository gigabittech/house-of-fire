import { type NextRequest, NextResponse } from 'next/server';

/**
 * Legacy / direct Supabase redirects may land on `/auth/callback` instead of
 * `/auth/callback/client`. Forward auth params to the client handler, which
 * can read URL hashes and exchange PKCE codes in the browser.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const hasAuthQuery =
    url.searchParams.has('code') ||
    url.searchParams.has('token_hash') ||
    url.searchParams.has('token') ||
    (url.searchParams.has('access_token') && url.searchParams.has('refresh_token'));

  if (hasAuthQuery) {
    url.pathname = '/auth/callback/client';
    return NextResponse.redirect(url.toString());
  }

  return NextResponse.redirect(`${url.origin}/sign-in?error=auth`);
}
