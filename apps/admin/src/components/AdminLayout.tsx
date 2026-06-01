'use client';

import { usePathname, useRouter } from 'next/navigation.js';
import Link from 'next/link.js';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon.js';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types.js';
import { breakpoints } from '@hof/design-tokens';

function getBrowserClient() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? 'https://placeholder.supabase.co';
  const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? 'placeholder-anon-key';
  return createClient<Database>(url, key);
}

const NAV_ITEMS: Array<{ id: string; href: string; icon: string; label: string; badge?: string }> = [
  { id: 'dashboard',  href: '/dashboard',  icon: 'chart',    label: 'Dashboard' },
  { id: 'events',     href: '/events',     icon: 'calendar', label: 'Events' },
  { id: 'guests',     href: '/guests',     icon: 'users',    label: 'Guest list' },
  { id: 'door',       href: '/door',       icon: 'qr',       label: 'Door' },
  { id: 'media',      href: '/media',      icon: 'image',    label: 'Photo review', badge: '4' },
  { id: 'members',    href: '/members',    icon: 'user',     label: 'Members' },
  { id: 'mod',        href: '/mod',        icon: 'flag',     label: 'Moderation', badge: '2' },
  { id: 'announce',   href: '/announce',   icon: 'bell',     label: 'Announcements' },
  { id: 'codes',      href: '/codes',      icon: 'tag',      label: 'Codes & comps' },
  { id: 'financials', href: '/financials', icon: 'wallet',   label: 'Financials' },
];

// Breakpoint thresholds derived from design-tokens.
// The token set only defines mobile (390) and desktop (1280); we add a tablet
// threshold at 768px which sits between the two.
const BP_TABLET = 768;
const BP_DESKTOP = breakpoints.desktop; // 1280

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

  // Close drawer whenever the route changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + '/');
  }

  async function handleSignOut() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  // ── Sidebar column widths ──────────────────────────────────────────────────
  const sidebarWidth = sidebarMode === 'full' ? 232 : sidebarMode === 'icon-only' ? 60 : 0;

  // ── Shared sidebar content ─────────────────────────────────────────────────
  function SidebarContent({ compact }: { compact: boolean }) {
    return (
      <>
        {/* Brand header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: compact ? 0 : 10,
          padding: compact ? '0 0 22px' : '0 6px 22px',
          justifyContent: compact ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--hof-amber), var(--hof-ember))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                stroke="var(--hof-bg)" strokeWidth="1.5" strokeLinejoin="round"
                d="M12 3c2 4 6 6 6 11a6 6 0 01-12 0c0-3 2-4 2-7 1 1 1.5 2 2 3 .5-3 1-5 2-7z"
              />
            </svg>
          </div>
          {!compact && (
            <div>
              <div style={{
                fontFamily: 'Clash Display, system-ui', fontWeight: 600, fontSize: 13,
                color: 'var(--hof-text)', letterSpacing: '0.16em', textTransform: 'uppercase',
              }}>House of Fire</div>
              <div style={{
                fontFamily: 'Inter, system-ui', fontSize: 10, color: 'var(--hof-text-sec)',
                letterSpacing: '0.16em', textTransform: 'uppercase',
              }}>Admin Console</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                title={compact ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: compact ? 0 : 10,
                  padding: compact ? '10px 0' : '9px 10px',
                  justifyContent: compact ? 'center' : 'flex-start',
                  borderRadius: 6, textDecoration: 'none',
                  background: active ? 'var(--hof-elevated)' : 'transparent',
                  color: active ? 'var(--hof-text)' : 'var(--hof-text-sec)',
                  borderLeft: active ? '2px solid var(--hof-amber)' : '2px solid transparent',
                  transition: 'background 100ms',
                  position: 'relative',
                }}
              >
                <Icon
                  name={item.icon}
                  size={16}
                  color={active ? 'var(--hof-amber)' : 'var(--hof-text-sec)'}
                />
                {!compact && (
                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{item.label}</span>
                )}
                {/* Badge dot in compact mode */}
                {compact && item.badge && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 6, height: 6, borderRadius: 3,
                    background: item.id === 'mod' ? 'var(--hof-warning)' : 'var(--hof-amber)',
                  }} />
                )}
                {!compact && item.id === 'door' && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 9, fontWeight: 600, color: 'var(--hof-success)',
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: 3, background: 'var(--hof-success)',
                      animation: 'hof-pulse 1.4s ease-in-out infinite', flexShrink: 0,
                    }} />
                    Live
                  </span>
                )}
                {!compact && item.badge && item.id !== 'door' && (
                  <span style={{
                    background: item.id === 'mod' ? 'var(--hof-warning)' : 'var(--hof-amber)',
                    color: 'var(--hof-bg)', fontSize: 10, fontWeight: 600,
                    padding: '2px 6px', borderRadius: 8,
                  }}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--hof-border)',
          display: 'flex', alignItems: 'center',
          gap: compact ? 0 : 10,
          padding: '12px 6px 0',
          justifyContent: compact ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--hof-amber), var(--hof-ember))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter, system-ui', fontSize: 12, fontWeight: 600, color: 'var(--hof-bg)',
          }}>JG</div>
          {!compact && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--hof-text)' }}>Jordan Groth</div>
              <div style={{ fontSize: 10, color: 'var(--hof-text-sec)' }}>Owner · Boulder</div>
            </div>
          )}
          {!compact && (
            <button
              onClick={() => { void handleSignOut(); }}
              title="Sign out"
              style={{
                width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                background: 'transparent', border: '1px solid var(--hof-border)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path
                  stroke="var(--hof-text-sec)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
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
    <div style={{
      width: '100vw', height: '100vh', display: 'flex',
      background: 'var(--hof-bg)', color: 'var(--hof-text)',
      fontFamily: 'Inter, system-ui', overflow: 'hidden',
    }}>
      {/* ── Sidebar: full or icon-only (>=768px) ─────────────────────────────*/}
      {sidebarMode !== 'hidden' && (
        <div style={{
          width: sidebarWidth, flexShrink: 0,
          background: 'var(--hof-surface)', borderRight: '1px solid var(--hof-border)',
          padding: sidebarMode === 'icon-only' ? '20px 8px' : '20px 14px',
          display: 'flex', flexDirection: 'column',
          transition: 'width 200ms ease',
          overflow: 'hidden',
        }}>
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
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.55)',
            }}
          />
          {/* Drawer panel */}
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
            width: 232,
            background: 'var(--hof-surface)', borderRight: '1px solid var(--hof-border)',
            padding: '20px 14px', display: 'flex', flexDirection: 'column',
            animation: 'adminDrawerSlideIn 180ms ease',
          }}>
            <SidebarContent compact={false} />
          </div>
        </>
      )}

      {/* ── Main content ─────────────────────────────────────────────────────*/}
      <main style={{
        flex: 1, overflowY: 'auto', position: 'relative',
        scrollbarWidth: 'thin',
      }}>
        {/* Hamburger — visible only when sidebar is hidden */}
        {sidebarMode === 'hidden' && (
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label="Open navigation"
            style={{
              position: 'sticky', top: 12, left: 12, zIndex: 30,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              background: 'var(--hof-surface)', border: '1px solid var(--hof-border)',
              cursor: 'pointer', marginLeft: 12, marginTop: 12,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                stroke="var(--hof-text)" strokeWidth="1.5" strokeLinecap="round"
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
