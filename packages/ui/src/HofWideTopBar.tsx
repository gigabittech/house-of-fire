'use client';

import { colors } from '@hof/design-tokens';
import type { ReactNode } from 'react';
import { hofChromeIconRow } from './hofChromeIcon';
import { HofLogoMark } from './HofLogoMark';

const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const logoChrome = (size: number): React.CSSProperties => ({
  width: size + 14,
  height: size + 14,
  borderRadius: 12,
  background: 'rgba(20,20,18,0.62)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid rgba(42,40,38,0.7)`,
  flexShrink: 0,
  boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
});

export interface HofWideTopBarProps {
  pageTitle: string;
  actions?: ReactNode;
  /** Matches sidebar rail width so the logo column aligns with nav. */
  sidebarWidth: number;
  compactSidebar?: boolean;
  homeHref?: string;
}

/** Wide top bar — logo in sidebar column, chrome icon actions right (matches mobile). */
export function HofWideTopBar({
  pageTitle,
  actions,
  sidebarWidth,
  compactSidebar = false,
  homeHref = '/',
}: HofWideTopBarProps) {
  const logoSize = compactSidebar ? 34 : 48;

  return (
    <header
      style={{
        flexShrink: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'stretch',
        minHeight: 52,
        background: 'rgba(10,10,8,0.88)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        borderBottom: `1px solid ${colors.border}`,
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <span style={visuallyHidden}>{pageTitle}</span>

      <div
        style={{
          flexShrink: 0,
          width: sidebarWidth,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: `1px solid ${colors.border}`,
          boxSizing: 'border-box',
          padding: '6px 0',
        }}
      >
        <a
          href={homeHref}
          aria-label="Home"
          className="hof-btn hof-press"
          style={logoChrome(logoSize)}
        >
          <HofLogoMark size={logoSize} alt="House of Fire" />
        </a>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          minWidth: 0,
          padding: '0 16px',
        }}
      >
        {actions ? <div style={hofChromeIconRow}>{actions}</div> : null}
      </div>
    </header>
  );
}
