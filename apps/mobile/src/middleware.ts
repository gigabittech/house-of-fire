import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that should be reachable without a session.
// Note: `/` is intentionally NOT public (it's the member dashboard).
const PUBLIC_ROUTES = [
  '/landing',
  '/onboarding',
  '/auth/callback',
  '/event',
  '/archive',
  '/live',
  '/accept-transfer',
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? (() => { if (process.env.NODE_ENV === 'production') throw new Error('NEXT_PUBLIC_SUPABASE_URL is required'); return 'http://localhost:54321'; })(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (() => { if (process.env.NODE_ENV === 'production') throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required'); return 'local-anon-key'; })(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Gracefully handle missing/placeholder Supabase credentials — treat as
  // unauthenticated so public routes still render during local dev without .env.local.
  let user: { id: string } | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }

  const pathname = request.nextUrl.pathname;
  const isPublic =
    PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/')) ||
    pathname.startsWith('/community') ||
    pathname.startsWith('/dev/login'); // dev-only impersonation route (guarded by NODE_ENV)

  if (
    !user &&
    !isPublic &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/landing';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|manifest|sw.js).*)'],
};
