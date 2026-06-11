'use client';

import { HofAdminAppShell, type AdminNavId } from '@hof/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useNavCountsRealtime } from '@/hooks/useNavCountsRealtime';
import { ADMIN_NAV_HREF, adminNavIdFromPath, adminPageTitle } from '@/lib/adminNav';
import { createClient } from '@/lib/supabase';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mediaBadge, setMediaBadge] = useState<string | undefined>();
  const [modBadge, setModBadge] = useState<string | undefined>();
  const [userName, setUserName] = useState('Admin');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('Crew');

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/nav-counts');
      if (!res.ok) return;
      const data = (await res.json()) as { mediaPending: number; modPending: number };
      setMediaBadge(data.mediaPending > 0 ? String(data.mediaPending) : undefined);
      setModBadge(data.modPending > 0 ? String(data.modPending) : undefined);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const applyMediaDelta = useCallback((delta: number) => {
    setMediaBadge((prev) => {
      const n = Math.max(0, (prev ? Number.parseInt(prev, 10) : 0) + delta);
      return n > 0 ? String(n) : undefined;
    });
  }, []);

  const applyModDelta = useCallback((delta: number) => {
    setModBadge((prev) => {
      const n = Math.max(0, (prev ? Number.parseInt(prev, 10) : 0) + delta);
      return n > 0 ? String(n) : undefined;
    });
  }, []);

  useNavCountsRealtime({
    onMediaDelta: applyMediaDelta,
    onModDelta: applyModDelta,
  });

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      const name = profile?.display_name ?? user.email?.split('@')[0] ?? 'Admin';
      setUserName(name);
      setUserAvatarUrl(profile?.avatar_url ?? null);
      const roleLabel =
        profile?.role === 'admin' ? 'Owner' : profile?.role === 'crew' ? 'Crew' : 'Member';
      setUserRole(roleLabel);
    }
    void loadProfile();
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  const handleNav = useCallback(
    (id: AdminNavId) => {
      const href = ADMIN_NAV_HREF[id];
      if (pathname === href || pathname.startsWith(`${href}/`)) return;
      router.push(href);
    },
    [pathname, router],
  );

  return (
    <HofAdminAppShell
      active={adminNavIdFromPath(pathname)}
      onNav={handleNav}
      pageTitle={adminPageTitle(pathname)}
      user={{
        name: userName,
        email: userRole,
        avatarUrl: userAvatarUrl,
      }}
      onSignOut={() => {
        void handleSignOut();
      }}
      badges={{
        media: mediaBadge,
        mod: modBadge,
      }}
    >
      {children}
    </HofAdminAppShell>
  );
}
