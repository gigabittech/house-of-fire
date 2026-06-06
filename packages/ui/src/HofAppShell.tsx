'use client';

import { colors, fontFamilies, sidebarWidth } from '@hof/design-tokens';
import type { CSSProperties, ReactNode } from 'react';
import { Avatar } from './feed/Avatar';
import type { HofAppHeaderUser } from './HofAppHeader';
import { HofBottomNav, type NavId } from './HofBottomNav';
import { HofLogoMark } from './HofLogoMark';
import { hofChromeCircleBtn, hofChromeIconRow } from './hofChromeIcon';
import { HofMobilePageHeader } from './HofMobilePageHeader';
import { Icon } from './Icon';
import { filterMemberNavItems } from './memberNav';
import { useResponsive } from './useBreakpoint';

const SIDEBAR_WIDTH = sidebarWidth.full;
const SIDEBAR_WIDTH_TABLET = sidebarWidth.rail;
/** Align logo, nav icons, and footer avatar to the same column (matches admin inset). */
const SIDEBAR_INSET_X = 10;
const SIDEBAR_PAD_TOP = 14;
const SIDEBAR_ACCENT_W = 2;

function sidebarNavItemStyle(compact: boolean, isActive: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: compact ? 0 : 10,
    padding: compact ? '10px 0' : `9px 10px 9px ${SIDEBAR_INSET_X}px`,
    justifyContent: compact ? 'center' : 'flex-start',
    borderRadius: 6,
    width: '100%',
    background: isActive ? colors.elevated : 'transparent',
    color: isActive ? colors.text : colors.textSec,
    border: 'none',
    transition: 'background 100ms',
    position: 'relative',
    boxSizing: 'border-box',
  };
}

function SidebarActiveAccent() {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        top: 5,
        bottom: 5,
        width: SIDEBAR_ACCENT_W,
        borderRadius: 1,
        background: colors.amber,
      }}
    />
  );
}

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
  );
}

function SidebarUserFooter({
  user,
  compact,
  onSignOut,
  onProfileClick,
}: {
  user: HofAppHeaderUser;
  compact: boolean;
  onSignOut?: () => void;
  onProfileClick?: () => void;
}) {
  return (
    <div
      style={{
        marginTop: 'auto',
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 0 : 8,
        paddingTop: 12,
        paddingLeft: compact ? 0 : SIDEBAR_INSET_X,
        justifyContent: compact ? 'center' : 'flex-start',
      }}
      title={compact ? `${user.name} · ${user.email}` : undefined}
    >
      {compact ? (
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
      ) : (
        <>
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
          {onSignOut ? <SidebarSignOutButton onClick={onSignOut} /> : null}
        </>
      )}
    </div>
  );
}

function HofSidebar({
  active,
  onChange,
  compact,
  user,
  onSignOut,
  excludeNavIds = [],
}: {
  active?: NavId;
  onChange?: (id: NavId) => void;
  compact: boolean;
  user?: HofAppHeaderUser | null;
  onSignOut?: () => void;
  excludeNavIds?: NavId[];
}) {
  const navItems = filterMemberNavItems(excludeNavIds);
  const sidebarPadding = compact ? '2px 0 16px' : `${SIDEBAR_PAD_TOP}px 12px 16px`;

  return (
    <nav
      aria-label="Main navigation"
      style={{
        flexShrink: 0,
        width: compact ? SIDEBAR_WIDTH_TABLET : SIDEBAR_WIDTH,
        height: '100%',
        background: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        padding: sidebarPadding,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <button
          type="button"
          className="hof-btn hof-press"
          aria-label="Home"
          onClick={() => onChange?.('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: compact ? 'center' : 'flex-start',
            width: '100%',
            flexShrink: 0,
            padding: compact ? '0 0 8px' : `10px 0 0 ${SIDEBAR_INSET_X}px`,
            lineHeight: 0,
            boxSizing: 'border-box',
            background: 'transparent',
            border: 'none',
          }}
        >
          {compact ? (
            <HofLogoMark size={24} alt="House of Fire" />
          ) : (
            <HofLogoMark
              fit="wordmark"
              variant="sidebar"
              width={132}
              src="/assets/hof-logo.png"
              alt="House of Fire"
            />
          )}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: compact ? 0 : 8 }}>
          {navItems.map((it) => {
            const isActive = active === it.id;
            return (
              <button
                key={it.id}
                type="button"
                className="hof-btn hof-press"
                onClick={() => onChange?.(it.id)}
                title={compact ? it.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                style={sidebarNavItemStyle(compact, isActive)}
              >
                {isActive && !compact ? <SidebarActiveAccent /> : null}
                <Icon
                  name={it.icon}
                  size={16}
                  color={isActive ? colors.amber : colors.textSec}
                />
                {!compact && (
                  <span
                    style={{
                      fontFamily: fontFamilies.body,
                      fontSize: 13,
                      fontWeight: 500,
                      flex: 1,
                      textAlign: 'left',
                    }}
                  >
                    {it.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {user ? (
        <SidebarUserFooter
          user={user}
          compact={compact}
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
  excludeNavIds = [],
  children,
}: HofAppShellProps) {
  const { isWide, isTablet, mounted } = useResponsive();
  const showMobilePageHeader = (!mounted || !isWide) && !hideMobilePageHeader;
  const showWideActions = mounted && isWide && (headerActions || onBack);

  const mainColumn = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100%',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <main style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {showMobilePageHeader ? (
          <HofMobilePageHeader title={pageTitle} actions={headerActions} onBack={onBack} />
        ) : null}
        {showWideActions ? (
          <div
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
                  <Icon name="chev" size={16} color={colors.text} style={{ transform: 'rotate(180deg)' }} />
                </button>
              ) : null}
              {headerActions}
            </div>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );

  if (!mounted || !isWide) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        {mainColumn}
        {!hideBottomNav ? (
          <HofBottomNav active={active} onChange={onNav} excludeNavIds={excludeNavIds} />
        ) : null}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <HofSidebar
        active={active}
        onChange={onNav}
        compact={isTablet}
        user={user}
        onSignOut={onSignOut}
        excludeNavIds={excludeNavIds}
      />
      {mainColumn}
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
