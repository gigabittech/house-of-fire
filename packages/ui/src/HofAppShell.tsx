'use client';

import { colors } from '@hof/design-tokens';
import type { ReactNode } from 'react';
import { HofBottomNav, type NavId } from './HofBottomNav';
import { HofLogoMark } from './HofLogoMark';
import { Icon, type IconName } from './Icon';
import { useResponsive } from './useBreakpoint';

interface NavItem {
  id: NavId;
  label: string;
  icon: IconName;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'events', label: 'Events', icon: 'calendar' },
  { id: 'community', label: 'Community', icon: 'chat' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

const SIDEBAR_WIDTH = 240;
const SIDEBAR_WIDTH_TABLET = 76; // icon-only rail on tablet

// ─── Sidebar (tablet + desktop) ───────────────────────────────────────────────

function HofSidebar({
  active,
  onChange,
  compact,
}: {
  active?: NavId;
  onChange?: (id: NavId) => void;
  compact: boolean;
}) {
  return (
    <nav
      style={{
        flexShrink: 0,
        width: compact ? SIDEBAR_WIDTH_TABLET : SIDEBAR_WIDTH,
        height: '100%',
        background: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: compact ? '2px 0' : '2px 12px',
        gap: 0,
      }}
    >
      {/* Brand */}
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
          <HofLogoMark size={24} />
        ) : (
          <HofLogoMark fit="wordmark" width={140} />
        )}
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map((it) => {
        const isActive = active === it.id;
        return (
          <button
            key={it.id}
            type="button"
            className="hof-btn hof-press"
            onClick={() => onChange?.(it.id)}
            title={it.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: compact ? 'center' : 'flex-start',
              padding: compact ? '12px 0' : '11px 12px',
              borderRadius: 10,
              background: isActive ? colors.elevated : 'transparent',
              border: `1px solid ${isActive ? colors.border : 'transparent'}`,
              width: '100%',
            }}
          >
            <Icon name={it.icon} size={20} color={isActive ? colors.amber : colors.textSec} />
            {!compact && (
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? colors.text : colors.textSec,
                }}
              >
                {it.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ─── App shell ────────────────────────────────────────────────────────────────

export interface HofAppShellProps {
  active?: NavId;
  onNav?: (id: NavId) => void;
  children: ReactNode;
}

/**
 * Adaptive navigation chrome shared by every member screen.
 *
 *  mobile  → children full-bleed + bottom tab bar
 *  tablet  → icon-only left rail + content
 *  desktop → full left sidebar + content
 *
 * Screens render their own scrollable content as `children` and should NOT
 * render their own HofBottomNav — the shell owns navigation. On wide screens
 * the content sits in a `position:relative` <main>, so screens that use
 * `position:absolute; inset:0` scroll containers keep working unchanged.
 */
export function HofAppShell({ active, onNav, children }: HofAppShellProps) {
  const { isWide, isTablet, mounted } = useResponsive();

  // SSR + first paint always render the mobile layout so markup matches and
  // hydration is clean; the wide layout swaps in after mount.
  if (!mounted || !isWide) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        {children}
        <HofBottomNav active={active} onChange={onNav} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      <HofSidebar active={active} onChange={onNav} compact={isTablet} />
      <main style={{ position: 'relative', flex: 1, height: '100%', overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}

// ─── Content width cap ────────────────────────────────────────────────────────

export interface HofContentProps {
  children: ReactNode;
  /** Max content width on wide screens (px). Default 760. */
  maxWidth?: number;
  style?: React.CSSProperties;
}

/**
 * Centers and caps content width on tablet/desktop so text columns and cards
 * don't stretch edge-to-edge on wide monitors. On mobile it's a passthrough.
 */
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
