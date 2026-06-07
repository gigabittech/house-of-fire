'use client';

import { colors, fontFamilies } from '@hof/design-tokens';
import { HofLogoMark } from '@hof/ui';
import type { CSSProperties, ReactNode } from 'react';
import { useLandingLayout } from './useLandingLayout';

export function LandingChrome({
  children,
  centerHeader = false,
}: {
  children: ReactNode;
  centerHeader?: boolean;
}) {
  const { pageColumnClassName } = useLandingLayout();

  const footerStyle: CSSProperties = {
    flexShrink: 0,
    paddingTop: 20,
    paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
    fontFamily: fontFamilies.body,
    fontSize: 11,
    color: colors.textDis,
    letterSpacing: '0.12em',
    textTransform: 'lowercase',
    borderTop: `1px solid ${colors.border}`,
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100dvh',
        overflow: 'hidden',
        background: colors.bg,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <header
          className={pageColumnClassName}
          style={{
            flexShrink: 0,
            paddingTop: `calc(12px + env(safe-area-inset-top, 0px))`,
            paddingBottom: 12,
            display: 'flex',
            justifyContent: centerHeader ? 'center' : 'flex-start',
          }}
        >
          <div className="hof-landing-logo">
            <HofLogoMark
              fit="wordmark"
              variant="sidebar"
              src="/assets/hof-logo.png"
              width={112}
              alt="House of Fire"
            />
          </div>
        </header>

        <main
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {children}
        </main>

        <footer className={pageColumnClassName} style={footerStyle}>
          houseoffire.events · Boulder, CO
        </footer>
      </div>
    </div>
  );
}
