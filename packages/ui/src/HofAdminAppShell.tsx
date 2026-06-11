'use client';

import { colors, fontFamilies } from '@hof/design-tokens';
import { useEffect, useState, type ReactNode } from 'react';
import { ADMIN_NAV_ITEMS, type AdminNavId } from './adminNav';
import { Avatar } from './feed/Avatar';
import type { HofAppHeaderUser } from './HofAppHeader';
import { HofLogoMark } from './HofLogoMark';
import { HofMobilePageHeader } from './HofMobilePageHeader';
import { Icon } from './Icon';

function initialsFromName(name: string): string {
  return (
    name
      .split(' ')
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase() || '?'
  );
}

function NavLabel({ label, badge }: { label: string; badge?: string }) {
  if (!badge) return <>{label}</>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span>{label}</span>
      <span
        style={{
          background: colors.amber,
          color: colors.bg,
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: 8,
          lineHeight: 1.4,
        }}
      >
        {badge}
      </span>
    </span>
  );
}

function AdminNavList({
  active,
  onChange,
  badges = {},
}: {
  active?: AdminNavId;
  onChange?: (id: AdminNavId) => void;
  badges?: Partial<Record<AdminNavId, string>>;
}) {
  return (
    <div className="hof-admin-nav-list">
      {ADMIN_NAV_ITEMS.map((it) => {
        const isActive = active === it.id;
        const badge = badges[it.id];
        return (
          <button
            key={it.id}
            type="button"
            className="hof-btn hof-press hof-admin-nav-btn"
            onClick={() => onChange?.(it.id)}
            aria-current={isActive ? 'page' : undefined}
            title={it.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 10px',
              borderRadius: 6,
              background: isActive ? colors.elevated : 'transparent',
              color: isActive ? colors.text : colors.textSec,
              border: 'none',
              borderLeft: isActive ? `2px solid ${colors.amber}` : '2px solid transparent',
              width: '100%',
              cursor: 'pointer',
              fontFamily: fontFamilies.body,
              fontSize: 13,
              fontWeight: 500,
              textAlign: 'left',
              boxSizing: 'border-box',
            }}
          >
            <Icon name={it.icon} size={16} color={isActive ? colors.amber : colors.textSec} />
            <span className="hof-admin-nav-label" style={{ flex: 1 }}>
              <NavLabel label={it.label} badge={badge} />
            </span>
            {it.id === 'door' ? (
              <span className="hof-admin-nav-live">
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    background: colors.success,
                    animation: 'hof-pulse 1.4s ease-in-out infinite',
                    flexShrink: 0,
                  }}
                />
                Live
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function AdminSidebar({
  active,
  onChange,
  user,
  onSignOut,
  badges = {},
  inDrawer = false,
}: {
  active?: AdminNavId;
  onChange?: (id: AdminNavId) => void;
  user?: HofAppHeaderUser | null;
  onSignOut?: () => void;
  badges?: Partial<Record<AdminNavId, string>>;
  inDrawer?: boolean;
}) {
  return (
    <nav
      aria-label="Admin navigation"
      className={inDrawer ? undefined : 'hof-app-sidebar hof-admin-sidebar'}
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        ...(inDrawer
          ? {}
          : {
              background: colors.surface,
              borderRight: `1px solid ${colors.border}`,
            }),
      }}
    >
      <div
        className="hof-admin-sidebar-logo"
        style={{
          flexShrink: 0,
          marginTop: 16,
          marginBottom: 20,
          lineHeight: 0,
        }}
      >
        <button
          type="button"
          className="hof-btn hof-press"
          aria-label="Dashboard"
          onClick={() => onChange?.('dashboard')}
          style={{ padding: 0, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <span className="hof-admin-logo-wordmark">
            <HofLogoMark
              fit="wordmark"
              variant="sidebar"
              width={140}
              src="/assets/hof-logo.png"
              alt="House of Fire"
            />
          </span>
          <span className="hof-admin-logo-compact">
            <HofLogoMark size={24} alt="House of Fire" />
          </span>
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <AdminNavList active={active} onChange={onChange} badges={badges} />
      </div>

      {user ? (
        <div
          style={{
            flexShrink: 0,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 6px 0',
          }}
        >
          <Avatar
            initials={initialsFromName(user.name)}
            src={user.avatarUrl}
            alt={user.name}
            size={32}
          />
          <div className="hof-admin-nav-label" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.text }}>{user.name}</div>
            <div style={{ fontSize: 10, color: colors.textSec }}>{user.email}</div>
          </div>
          {onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                flexShrink: 0,
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  stroke={colors.textSec}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                />
              </svg>
            </button>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}

export type HofAdminAppShellProps = {
  active?: AdminNavId;
  onNav?: (id: AdminNavId) => void;
  user?: HofAppHeaderUser | null;
  onSignOut?: () => void;
  pageTitle?: string;
  badges?: Partial<Record<AdminNavId, string>>;
  children: ReactNode;
};

/**
 * Admin shell — member click-through layout with flat admin sidebar (no capsule nav).
 */
export function HofAdminAppShell({
  active,
  onNav,
  user,
  onSignOut,
  pageTitle = 'Admin',
  badges,
  children,
}: HofAdminAppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [active]);

  const handleNav = (id: AdminNavId) => {
    setDrawerOpen(false);
    onNav?.(id);
  };

  return (
    <div className="hof-app-shell">
      <AdminSidebar
        active={active}
        onChange={handleNav}
        user={user}
        onSignOut={onSignOut}
        badges={badges}
      />

      {drawerOpen ? (
        <>
          <div
            className="hof-show-mobile-only"
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(0,0,0,0.55)',
            }}
          />
          <div
            className="hof-show-mobile-only"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 210,
              width: 220,
              background: colors.surface,
              borderRight: `1px solid ${colors.border}`,
              padding: '2px 12px 16px',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            <AdminSidebar
              active={active}
              onChange={handleNav}
              user={user}
              onSignOut={onSignOut}
              badges={badges}
              inDrawer
            />
          </div>
        </>
      ) : null}

      <div className="hof-app-shell-main">
        <main style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="hof-show-mobile-only">
            <HofMobilePageHeader
              title={pageTitle}
              actions={
                <button
                  type="button"
                  className="hof-btn hof-press"
                  aria-label="Open navigation"
                  onClick={() => setDrawerOpen(true)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      stroke={colors.text}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              }
            />
          </div>

          <div
            className="hof-scroll hof-app-page-scroll"
            style={{
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
            }}
          >
            {children}
          </div>
        </main>
      </div>

      <style>{`
        .hof-admin-sidebar .hof-admin-logo-compact {
          display: none;
        }
        .hof-admin-sidebar .hof-admin-logo-wordmark {
          display: block;
        }
        .hof-admin-sidebar .hof-admin-nav-live {
          display: none;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          font-weight: 600;
          color: var(--hof-success);
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        @media (min-width: 1280px) {
          .hof-admin-sidebar .hof-admin-nav-live {
            display: inline-flex;
          }
        }
        @media (min-width: 768px) and (max-width: 1279px) {
          .hof-admin-sidebar {
            padding: 2px 0 16px !important;
          }
          .hof-admin-sidebar .hof-admin-logo-wordmark {
            display: none;
          }
          .hof-admin-sidebar .hof-admin-logo-compact {
            display: block;
          }
          .hof-admin-sidebar .hof-admin-nav-label {
            display: none;
          }
          .hof-admin-sidebar .hof-admin-nav-live {
            display: none !important;
          }
          .hof-admin-nav-btn {
            justify-content: center !important;
            padding: 10px 0 !important;
            gap: 0 !important;
          }
        }
        @media (min-width: 1280px) {
          .hof-admin-sidebar {
            padding: 2px 12px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
