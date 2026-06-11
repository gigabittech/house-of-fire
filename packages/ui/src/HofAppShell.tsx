'use client';

import { colors, fontFamilies } from '@hof/design-tokens';
import type { ReactNode } from 'react';
import { Avatar } from './feed/Avatar';
import type { HofAppHeaderUser } from './HofAppHeader';
import { HofBottomNav, type NavId } from './HofBottomNav';
import { HofLogoMark } from './HofLogoMark';
import { hofChromeCircleBtn, hofChromeIconRow } from './hofChromeIcon';
import { HofMobilePageHeader } from './HofMobilePageHeader';
import { Icon } from './Icon';
import { filterMemberNavItems } from './memberNav';

const SIDEBAR_INSET_X = 10;
const SIDEBAR_HOME_ICON = '/assets/icon.png';

function initialsFromName(name: string): string {
  return (
    name
      .split(' ')
      .map((w) => w[0] ?? '')
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

function SidebarSignOutButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      className="hof-btn hof-press"
      onClick={onClick}
      title="Sign out"
      aria-label="Sign out"
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        flexShrink: 0,
        background: 'transparent',
        border: 'none',
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
  );
}

function SidebarUserFooter({
  user,
  onSignOut,
  onProfileClick,
}: {
  user: HofAppHeaderUser;
  onSignOut?: () => void;
  onProfileClick?: () => void;
}) {
  return (
    <div className="hof-sidebar-footer" style={{ paddingTop: 12 }}>
      <div className="hof-sidebar-user-compact" title={`${user.name} · ${user.email}`}>
        <button
          type="button"
          className="hof-btn hof-press"
          aria-label="Open profile"
          onClick={onProfileClick}
          style={{ padding: 0, background: 'transparent', border: 'none' }}
        >
          <Avatar
            initials={initialsFromName(user.name)}
            src={user.avatarUrl}
            alt={user.name}
            size={32}
          />
        </button>
      </div>

      <div
        className="hof-sidebar-user-full"
        style={{
          alignItems: 'center',
          gap: 8,
          paddingLeft: SIDEBAR_INSET_X,
        }}
      >
        <button
          type="button"
          className="hof-btn hof-press"
          aria-label="Open profile"
          onClick={onProfileClick}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 0,
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
          }}
        >
          <Avatar
            initials={initialsFromName(user.name)}
            src={user.avatarUrl}
            alt={user.name}
            size={32}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: fontFamilies.body,
                fontSize: 12,
                fontWeight: 500,
                color: colors.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontFamily: fontFamilies.body,
                fontSize: 10,
                color: colors.textSec,
                marginTop: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.email}
            </div>
          </div>
        </button>
        {onSignOut ? (
          <span className="hof-sidebar-sign-out">
            <SidebarSignOutButton onClick={onSignOut} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function HofSidebar({
  active,
  onChange,
  user,
  onSignOut,
  excludeNavIds = [],
  hidden = false,
}: {
  active?: NavId;
  onChange?: (id: NavId) => void;
  user?: HofAppHeaderUser | null;
  onSignOut?: () => void;
  excludeNavIds?: NavId[];
  hidden?: boolean;
}) {
  const navItems = filterMemberNavItems(excludeNavIds);

  return (
    <nav
      aria-label="Main navigation"
      className={hidden ? 'hof-app-sidebar hof-app-sidebar--hidden' : 'hof-app-sidebar'}
      aria-hidden={hidden || undefined}
      style={{
        overflow: 'hidden',
      }}
    >
      <div className="hof-sidebar-logo-area">
        <button
          type="button"
          className="hof-btn hof-press hof-sidebar-logo-btn"
          aria-label="Home"
          onClick={() => onChange?.('home')}
        >
          <span className="hof-sidebar-logo-compact">
            <span className="hof-sidebar-logo-compact-icon" style={hofChromeCircleBtn}>
              <img
                src={SIDEBAR_HOME_ICON}
                alt=""
                style={{ width: 30, height: 30, display: 'block', objectFit: 'contain' }}
              />
            </span>
          </span>
          <span className="hof-sidebar-logo-full">
            <HofLogoMark
              fit="wordmark"
              variant="sidebar"
              width={132}
              src="/assets/hof-logo.png"
              alt="House of Fire"
            />
          </span>
        </button>
      </div>

      <div className="hof-sidebar-nav-center">
        <div className="hof-sidebar-nav-group">
          <div className="hof-sidebar-nav-capsule">
            <div className="hof-sidebar-nav-list">
              {navItems.map((it) => {
                const isActive = active === it.id;
                const iconColor = isActive ? colors.amber : colors.textSec;
                return (
                  <button
                    key={it.id}
                    type="button"
                    className="hof-btn hof-press hof-sidebar-nav-item-btn"
                    onClick={() => onChange?.(it.id)}
                    aria-label={it.label}
                    aria-current={isActive ? 'page' : undefined}
                    data-active={isActive ? 'true' : 'false'}
                  >
                    <Icon name={it.icon} size={20} color={iconColor} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="hof-sidebar-nav-labels">
            {navItems.map((it) => {
              const isActive = active === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  className="hof-btn hof-press hof-sidebar-nav-label-btn"
                  onClick={() => onChange?.(it.id)}
                  aria-current={isActive ? 'page' : undefined}
                  data-active={isActive ? 'true' : 'false'}
                >
                  {it.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {user ? (
        <SidebarUserFooter
          user={user}
          onSignOut={onSignOut}
          onProfileClick={() => onChange?.('profile')}
        />
      ) : null}
    </nav>
  );
}

export interface HofAppShellProps {
  active?: NavId;
  onNav?: (id: NavId) => void;
  user?: HofAppHeaderUser | null;
  onSignOut?: () => void;
  pageTitle?: string;
  headerActions?: ReactNode;
  onBack?: () => void;
  hideMobilePageHeader?: boolean;
  hideBottomNav?: boolean;
  /** Hide tablet/desktop sidebar (e.g. full-screen overlays). */
  hideSidebar?: boolean;
  /** Hide nav tabs (e.g. Community when feature is off). */
  excludeNavIds?: NavId[];
  children: ReactNode;
}

/**
 * Adaptive navigation chrome shared by member screens (not auth).
 *
 *  mobile  → page header overlay + content + floating capsule tab bar
 *  tablet/desktop → sidebar (logo header + nav) + floating action icons on content
 */
export function HofAppShell({
  active,
  onNav,
  user,
  onSignOut,
  pageTitle = 'Home',
  headerActions,
  onBack,
  hideMobilePageHeader = false,
  hideBottomNav = false,
  hideSidebar = false,
  excludeNavIds = [],
  children,
}: HofAppShellProps) {
  const showWideActions = headerActions || onBack;

  return (
    <div className="hof-app-shell">
      <HofSidebar
        active={active}
        onChange={onNav}
        user={user}
        onSignOut={onSignOut}
        excludeNavIds={excludeNavIds}
        hidden={hideSidebar}
      />
      <div className="hof-app-shell-main">
        <main style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {!hideMobilePageHeader ? (
            <div className="hof-show-mobile-only">
              <HofMobilePageHeader title={pageTitle} actions={headerActions} onBack={onBack} />
            </div>
          ) : null}
          {showWideActions ? (
            <div
              className="hof-show-wide-only"
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                zIndex: 40,
                pointerEvents: 'auto',
              }}
            >
              <div style={hofChromeIconRow}>
                {onBack ? (
                  <button
                    type="button"
                    className="hof-btn hof-press"
                    onClick={onBack}
                    aria-label="Back"
                    style={hofChromeCircleBtn}
                  >
                    <Icon
                      name="chev"
                      size={16}
                      color={colors.text}
                      style={{ transform: 'rotate(180deg)' }}
                    />
                  </button>
                ) : null}
                {headerActions}
              </div>
            </div>
          ) : null}
          {children}
        </main>
        {!hideBottomNav ? (
          <div className="hof-show-mobile-only hof-mobile-nav-slot">
            <HofBottomNav active={active} onChange={onNav} excludeNavIds={excludeNavIds} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export interface HofContentProps {
  children: ReactNode;
  maxWidth?: number;
  style?: React.CSSProperties;
}

export function HofContent({ children, maxWidth = 760, style }: HofContentProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth,
        marginLeft: 'auto',
        marginRight: 'auto',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
