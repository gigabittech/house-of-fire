'use client';

import { breakpoints, sidebarWidth } from '@hof/design-tokens';
import { HofLogoMark } from '@hof/ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { createClient } from '@/lib/supabase';

const NAV_ITEMS: Array<{ id: string; href: string; icon: string; label: string; badge?: string }> =
  [
    { id: 'dashboard', href: '/dashboard', icon: 'chart', label: 'Dashboard' },
    { id: 'events', href: '/events', icon: 'calendar', label: 'Events' },
    { id: 'guests', href: '/guests', icon: 'users', label: 'Guest list' },
    { id: 'door', href: '/door', icon: 'qr', label: 'Door' },
    { id: 'media', href: '/media', icon: 'image', label: 'Photo review' },
    { id: 'members', href: '/members', icon: 'user', label: 'Members' },
    { id: 'mod', href: '/mod', icon: 'flag', label: 'Moderation' },
    { id: 'announce', href: '/announce', icon: 'bell', label: 'Announcements' },
    { id: 'codes', href: '/codes', icon: 'tag', label: 'Codes & comps' },
    { id: 'financials', href: '/financials', icon: 'wallet', label: 'Financials' },
  ];

// Breakpoint thresholds derived from design-tokens.
// The token set only defines mobile (390) and desktop (1280); we add a tablet
// threshold at 768px which sits between the two.
const BP_TABLET = 768;
const BP_DESKTOP = breakpoints.desktop; // 1280

/** Match member app `HofAppShell` sidebar chrome (shared design token). */
const SIDEBAR_WIDTH = sidebarWidth.full;
const SIDEBAR_WIDTH_TABLET = sidebarWidth.rail;

type SidebarMode = 'full' | 'icon-only' | 'hidden';

function useSidebarMode(): SidebarMode {
  const [mode, setMode] = useState<SidebarMode>('full');

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < BP_TABLET) {
        setMode('hidden');
      } else if (w < BP_DESKTOP) {
        setMode('icon-only');
      } else {
        setMode('full');
      }
    }

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return mode;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarMode = useSidebarMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mediaBadge, setMediaBadge] = useState<string | undefined>();
  const [modBadge, setModBadge] = useState<string | undefined>();
  const [userName, setUserName] = useState('Admin');
  const [userInitials, setUserInitials] = useState('AD');
  const [userRole, setUserRole] = useState('Crew');

  useEffect(() => {
    async function loadCounts() {
      try {
        const res = await fetch('/api/admin/nav-counts');
        if (!res.ok) return;
        const data = (await res.json()) as { mediaPending: number; modPending: number };
        if (data.mediaPending > 0) setMediaBadge(String(data.mediaPending));
        if (data.modPending > 0) setModBadge(String(data.modPending));
      } catch {
        /* silent */
      }
    }
    void loadCounts();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', user.id)
        .maybeSingle();
      const name = profile?.display_name ?? user.email?.split('@')[0] ?? 'Admin';
      setUserName(name);
      setUserInitials(
        name
          .split(' ')
          .map((p) => p[0] ?? '')
          .join('')
          .slice(0, 2)
          .toUpperCase(),
      );
      const roleLabel =
        profile?.role === 'admin' ? 'Owner' : profile?.role === 'crew' ? 'Crew' : 'Member';
      setUserRole(roleLabel);
    }
    void loadProfile();
  }, []);

  // Close drawer whenever the route changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset drawer on pathname change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + '/');
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  // ── Sidebar column widths (same as member HofAppShell) ───────────────────
  const sidebarWidth =
    sidebarMode === 'full' ? SIDEBAR_WIDTH : sidebarMode === 'icon-only' ? SIDEBAR_WIDTH_TABLET : 0;
  const sidebarPadding = sidebarMode === 'icon-only' ? '2px 0 16px' : '2px 12px 16px';

  // ── Shared sidebar content ─────────────────────────────────────────────────
  function SidebarContent({ compact }: { compact: boolean }) {
    return (
      <>
        {/* Brand header — matches HofAppShell */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: compact ? 'center' : 'flex-start',
            width: '100%',
            padding: 0,
            marginBottom: 4,
            lineHeight: 0,
            boxSizing: 'border-box',
          }}
        >
          {compact ? (
            <HofLogoMark size={24} alt="House of Fire" />
          ) : (
            <HofLogoMark fit="wordmark" width={140} alt="House of Fire" />
          )}
        </div>

        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const badge =
              item.id === 'media' ? mediaBadge : item.id === 'mod' ? modBadge : item.badge;
            const navItem = badge ? { ...item, badge } : item;
            const active = isActive(navItem.href);
            return (
              <Link
                key={navItem.id}
                href={navItem.href}
                title={compact ? navItem.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: compact ? 0 : 10,
                  padding: compact ? '10px 0' : '9px 10px',
                  justifyContent: compact ? 'center' : 'flex-start',
                  borderRadius: 6,
                  textDecoration: 'none',
                  background: active ? 'var(--hof-elevated)' : 'transparent',
                  color: active ? 'var(--hof-text)' : 'var(--hof-text-sec)',
                  borderLeft: active ? '2px solid var(--hof-amber)' : '2px solid transparent',
                  transition: 'background 100ms',
                  position: 'relative',
                }}
              >
                <Icon
                  name={navItem.icon}
                  size={16}
                  color={active ? 'var(--hof-amber)' : 'var(--hof-text-sec)'}
                />
                {!compact && (
                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{navItem.label}</span>
                )}
                {/* Badge dot in compact mode */}
                {compact && navItem.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: navItem.id === 'mod' ? 'var(--hof-warning)' : 'var(--hof-amber)',
                    }}
                  />
                )}
                {!compact && navItem.id === 'door' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 9,
                      fontWeight: 600,
                      color: 'var(--hof-success)',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        background: 'var(--hof-success)',
                        animation: 'hof-pulse 1.4s ease-in-out infinite',
                        flexShrink: 0,
                      }}
                    />
                    Live
                  </span>
                )}
                {!compact && navItem.badge && navItem.id !== 'door' && (
                  <span
                    style={{
                      background: item.id === 'mod' ? 'var(--hof-warning)' : 'var(--hof-amber)',
                      color: 'var(--hof-bg)',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 8,
                    }}
                  >
                    {navItem.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div
          style={{
            marginTop: 'auto',
            borderTop: '1px solid var(--hof-border)',
            display: 'flex',
            alignItems: 'center',
            gap: compact ? 0 : 10,
            padding: '12px 6px 0',
            justifyContent: compact ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              flexShrink: 0,
              background: 'linear-gradient(135deg, var(--hof-amber), var(--hof-ember))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--hof-bg)',
            }}
          >
            {userInitials}
          </div>
          {!compact && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--hof-text)' }}>
                {userName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--hof-text-sec)' }}>{userRole}</div>
            </div>
          )}
          {!compact && (
            <button
              onClick={() => {
                void handleSignOut();
              }}
              title="Sign out"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                flexShrink: 0,
                background: 'transparent',
                border: '1px solid var(--hof-border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path
                  stroke="var(--hof-text-sec)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                />
              </svg>
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        background: 'var(--hof-bg)',
        color: 'var(--hof-text)',
        fontFamily: 'Inter, system-ui',
        overflow: 'hidden',
      }}
    >
      {/* ── Sidebar: full or icon-only (>=768px) ─────────────────────────────*/}
      {sidebarMode !== 'hidden' && (
        <div
          style={{
            width: sidebarWidth,
            flexShrink: 0,
            background: 'var(--hof-surface)',
            borderRight: '1px solid var(--hof-border)',
            padding: sidebarPadding,
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 200ms ease',
            overflow: 'hidden',
          }}
        >
          <SidebarContent compact={sidebarMode === 'icon-only'} />
        </div>
      )}

      {/* ── Overlay drawer for mobile (<768px) ───────────────────────────────*/}
      {sidebarMode === 'hidden' && drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
              background: 'rgba(0,0,0,0.55)',
            }}
          />
          {/* Drawer panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 50,
              width: SIDEBAR_WIDTH,
              background: 'var(--hof-surface)',
              borderRight: '1px solid var(--hof-border)',
              padding: sidebarPadding,
              display: 'flex',
              flexDirection: 'column',
              animation: 'adminDrawerSlideIn 180ms ease',
            }}
          >
            <SidebarContent compact={false} />
          </div>
        </>
      )}

      {/* ── Main content ─────────────────────────────────────────────────────*/}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
          scrollbarWidth: 'thin',
        }}
      >
        {/* Hamburger — visible only when sidebar is hidden */}
        {sidebarMode === 'hidden' && (
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label="Open navigation"
            style={{
              position: 'sticky',
              top: 12,
              left: 12,
              zIndex: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--hof-surface)',
              border: '1px solid var(--hof-border)',
              cursor: 'pointer',
              marginLeft: 12,
              marginTop: 12,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                stroke="var(--hof-text)"
                strokeWidth="1.5"
                strokeLinecap="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
        {children}
      </main>

      {/* ── Drawer slide-in keyframe ──────────────────────────────────────────*/}
      <style>{`
        @keyframes adminDrawerSlideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
