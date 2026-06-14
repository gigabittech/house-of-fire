import type { NextRequest } from 'next/server';

const LANDING_PATH = '/landing';

/** Routes that stay reachable while the site is locked to the landing page. */
export function isLandingOnlyRoute(pathname: string): boolean {
  const exempt = [
    LANDING_PATH,
    '/sign-in',
    '/onboarding',
    '/auth/callback',
    '/auth/callback/client',
  ];
  return exempt.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Next.js internals, APIs, and static assets — never redirect these. */
export function isInfrastructureRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/assets')
  );
}

/**
 * Force landing-only mode even when a live event exists.
 * Set `HOF_COMING_SOON=false` to disable the env override.
 */
export function isComingSoonMode(): boolean {
  const value = process.env.HOF_COMING_SOON?.trim().toLowerCase();
  if (!value) return false;
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

/** Optional crew preview bypass (`HOF_COMING_SOON_BYPASS` + `?hof_preview=` or cookie). */
export function isComingSoonBypass(request: NextRequest): boolean {
  const secret = process.env.HOF_COMING_SOON_BYPASS?.trim();
  if (!secret) return false;
  if (request.cookies.get('hof_preview')?.value === secret) return true;
  return request.nextUrl.searchParams.get('hof_preview') === secret;
}

export function comingSoonBypassCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  };
}
