'use client';

import { colors, fontFamilies, shadows, sidebarWidth } from '@hof/design-tokens';
import type { ReactNode } from 'react';
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
const SIDEBAR_PAD_FULL = 14;
const SIDEBAR_PAD_RAIL = 10;

function SidebarLogoHeader({ compact }: { compact: boolean }) {
  const sidePad = compact ? SIDEBAR_PAD_RAIL : SIDEBAR_PAD_FULL;

  return (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: compact ? 'center' : 'flex-start',
        borderBottom: `1px solid ${colors.border}`,
        padding: compact ? '14px 10px' : '18px 14px 16px 20px',
        boxSizing: 'border-box',
      }}
    >
      <a
        href="/"
        aria-label="Home"
        className="hof-btn hof-press"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: compact ? 'center' : 'flex-start',
          lineHeight: 0,
          maxWidth: '100%',
        }}
      >
        {compact ? (
          <HofLogoMark size={40} alt="House of Fire" />
        ) : (
          <img
            src="/assets/hof-logo.png"
            alt=""
            style={{
              display: 'block',
              height: 40,
              width: 'auto',
              maxWidth: `calc(${SIDEBAR_WIDTH}px - ${sidePad + 20}px)`,
              objectFit: 'contain',
              objectPosition: 'left center',
              filter: shadows.logoGlow,
            }}
          />
        )}
      </a>
    </div>
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

function SidebarUserFooter({
  user,
  compact,
}: {
  user: HofAppHeaderUser;
  compact: boolean;
}) {
  return (
    <div
      style={{
        marginTop: 'auto',
        borderTop: `1px solid ${colors.border}`,
        padding: compact ? '12px 0 14px' : `12px ${SIDEBAR_PAD_FULL}px 14px`,
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 0 : 10,
        justifyContent: compact ? 'center' : 'flex-start',
      }}
      title={compact ? `${user.name} · ${user.email}` : undefined}
    >
      <Avatar initials={initialsFromName(user.name)} size={compact ? 30 : 32} />
      {!compact && (
        <div style={{ minWidth: 0, flex: 1 }}>
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
      )}
    </div>
  );
}

function HofSidebar({
  active,
  onChange,
  compact,
  user,
  excludeNavIds = [],
}: {
  active?: NavId;
  onChange?: (id: NavId) => void;
  compact: boolean;
  user?: HofAppHeaderUser | null;
  excludeNavIds?: NavId[];
}) {
  const navItems = filterMemberNavItems(excludeNavIds);

  return (
    <nav
      aria-label="Main navigation"
      style={{
        flexShrink: 0,
        width: compact ? SIDEBAR_WIDTH_TABLET : SIDEBAR_WIDTH,
        height: '100%',
        background: `linear-gradient(180deg, ${colors.surface} 0%, ${colors.bg} 100%)`,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <SidebarLogoHeader compact={compact} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: compact ? `14px ${SIDEBAR_PAD_RAIL}px 0` : `16px ${SIDEBAR_PAD_FULL}px 0`,
          minHeight: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((it) => {
            const isActive = active === it.id;
            return (
              <button
                key={it.id}
                type="button"
                className={`hof-btn hof-press hof-sidebar-nav-item${compact ? ' hof-sidebar-nav-item--compact' : ''}`}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => onChange?.(it.id)}
                title={compact ? it.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: compact ? 0 : 10,
                  justifyContent: compact ? 'center' : 'flex-start',
                  padding: compact ? '10px 0' : '9px 12px',
                  borderRadius: 10,
                  width: '100%',
                }}
              >
                <Icon
                  name={it.icon}
                  size={compact ? 18 : 16}
                  color={isActive ? colors.amber : colors.textSec}
                />
                {!compact && (
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? colors.text : colors.textSec,
                      letterSpacing: '0.01em',
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

      {user ? <SidebarUserFooter user={user} compact={compact} /> : null}
    </nav>
  );
}

export interface HofAppShellProps {
  active?: NavId;
  onNav?: (id: NavId) => void;
  user?: HofAppHeaderUser | null;
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
