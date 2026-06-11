import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import {
  comingSoonBypassCookieOptions,
  isComingSoonBypass,
  isComingSoonMode,
  isInfrastructureRoute,
  isLandingOnlyRoute,
} from './lib/comingSoon.server';
import { getLiveEvent } from './lib/liveEvent.server';

// Routes that should be reachable without a session (when the site is not locked).
const PUBLIC_ROUTES = [
  '/landing',
  '/sign-in',
  '/onboarding',
  '/auth/callback',
  '/auth/callback/client',
  '/event',
  '/archive',
  '/live',
  '/accept-transfer',
];

async function shouldLockToLanding(
  request: NextRequest,
  supabase: ReturnType<typeof createServerClient>,
) {
  if (isComingSoonBypass(request)) return false;
  if (isComingSoonMode()) return true;

  const { data: liveEvent } = await getLiveEvent(supabase, 'id');
  return !liveEvent;
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
      (() => {
        if (process.env.NODE_ENV === 'production')
          throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
        return 'http://localhost:54321';
      })(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      (() => {
        if (process.env.NODE_ENV === 'production')
          throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
        return 'local-anon-key';
      })(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;

  if (!isInfrastructureRoute(pathname) && !isLandingOnlyRoute(pathname)) {
    const lockToLanding = await shouldLockToLanding(request, supabase);
    if (lockToLanding) {
      const url = request.nextUrl.clone();
      url.pathname = '/landing';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  // Gracefully handle missing/placeholder Supabase credentials — treat as
  // unauthenticated so public routes still render during local dev without .env.local.
  let user: { id: string } | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }

  const isPublic =
    PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/')) ||
    pathname.startsWith('/dev/login');

  if (!user && !isPublic && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    const url = request.nextUrl.clone();
    url.pathname = '/landing';
    return NextResponse.redirect(url);
  }

  const bypassSecret = process.env.HOF_COMING_SOON_BYPASS?.trim();
  if (
    bypassSecret &&
    request.nextUrl.searchParams.get('hof_preview') === bypassSecret &&
    !request.cookies.get('hof_preview')
  ) {
    supabaseResponse.cookies.set('hof_preview', bypassSecret, comingSoonBypassCookieOptions());
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|manifest|sw.js).*)'],
};
