'use client';

import { RealtimeDisconnectedBanner, RealtimeProvider } from '@hof/realtime';
import { HofAppShell, type NavId, ToastProvider } from '@hof/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { AppHeaderProvider, useAppHeaderContext } from '@/context/AppHeaderContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { COMMUNITY_EXCLUDED_NAV_IDS, COMMUNITY_FEATURE_ENABLED } from '@/lib/features';
import { navHref } from '@/lib/nav';
import { PushSubscriptionSync } from '@/components/PushSubscriptionSync';
import { clearProfileCache } from '@/lib/profileCache';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

const STANDALONE_LAYOUT_PATHS = ['/sign-in', '/onboarding', '/landing', '/preview-access'];

function usesStandaloneLayout(pathname: string): boolean {
  return STANDALONE_LAYOUT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function activeFromPath(pathname: string): NavId | undefined {
  if (pathname === '/' || pathname === '/live') return 'home';
  if (pathname.startsWith('/event') || pathname.startsWith('/archive')) return 'events';
  if (pathname.startsWith('/community')) {
    return COMMUNITY_FEATURE_ENABLED ? 'community' : undefined;
  }
  if (
    pathname.startsWith('/profile') ||
    pathname.startsWith('/ticket') ||
    pathname.startsWith('/checkout')
  ) {
    return 'profile';
  }
  return undefined;
}

function titleFromPath(pathname: string): string {
  if (pathname === '/' || pathname === '/live') return 'Home';
  if (pathname.startsWith('/event')) return 'Event';
  if (pathname.startsWith('/archive')) return 'Archive';
  if (pathname.startsWith('/community'))
    return COMMUNITY_FEATURE_ENABLED ? 'Community' : 'House of Fire';
  if (pathname.startsWith('/profile/settings')) return 'Settings';
  if (pathname.startsWith('/profile')) return 'Profile';
  if (pathname.startsWith('/checkout')) return 'Checkout';
  if (pathname.startsWith('/ticket')) return 'Ticket';
  if (pathname.startsWith('/artists/')) return 'Artist';
  if (pathname.startsWith('/artists')) return 'Artists';
  if (pathname.startsWith('/landing')) return 'House of Fire';
  return 'House of Fire';
}

function AppChromeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthUser();
  const { config, chromeOverlay } = useAppHeaderContext();
  const hideBottomNav = pathname.startsWith('/checkout') || Boolean(chromeOverlay.hideBottomNav);
  const hideSidebar = Boolean(chromeOverlay.hideSidebar);

  const handleSignOut = useCallback(async () => {
    clearProfileCache();
    await createClient().auth.signOut();
    router.push('/landing');
  }, [router]);

  return (
    <ToastProvider>
      <HofAppShell
        active={activeFromPath(pathname)}
        onNav={(id: NavId) => router.push(navHref[id])}
        user={user}
        onSignOut={() => {
          void handleSignOut();
        }}
        pageTitle={config.title ?? titleFromPath(pathname)}
        headerActions={config.actions}
        onBack={config.onBack}
        hideMobilePageHeader={config.hideMobileHeader}
        hideBottomNav={hideBottomNav}
        hideSidebar={hideSidebar}
        excludeNavIds={[...COMMUNITY_EXCLUDED_NAV_IDS]}
      >
        {children}
      </HofAppShell>
    </ToastProvider>
  );
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (usesStandaloneLayout(pathname)) {
    return <div style={{ width: '100%', height: '100%', minHeight: '100dvh' }}>{children}</div>;
  }

  return (
    <RealtimeProvider supabase={supabase}>
      <AppHeaderProvider defaultTitle={titleFromPath(pathname)}>
        <PushSubscriptionSync />
        <AppChromeShell>{children}</AppChromeShell>
        <RealtimeDisconnectedBanner />
      </AppHeaderProvider>
    </RealtimeProvider>
  );
}
