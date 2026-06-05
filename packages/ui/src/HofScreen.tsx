import { colors, fontFamilies } from '@hof/design-tokens';
import type { CSSProperties, ReactNode } from 'react';

export interface HofScreenProps {
  children?: ReactNode;
  style?: CSSProperties;
}

// Dark screen wrapper — the base surface for every app screen.
export function HofScreen({ children, style = {} }: HofScreenProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: colors.bg,
        color: colors.text,
        fontFamily: fontFamilies.body,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface HofScrollProps {
  children?: ReactNode;
  style?: CSSProperties;
}

// Scroll region with native scrollbars hidden (see .hof-scroll in tokens.css).
export function HofScroll({ children, style = {} }: HofScrollProps) {
  return (
    <div
      className="hof-scroll"
      style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', ...style }}
    >
      {children}
    </div>
  );
}

/** Spacer matching the status-bar height. */
export function HofStatusbarSpacer() {
  return <div style={{ height: 'calc(12px + env(safe-area-inset-top, 0px))', minHeight: 12 }} />;
}

/** Spacer reserving room for the bottom nav + home indicator. */
export function HofHomeSpacer() {
  return (
    <div
      style={{
        height: 'calc(50px + max(6px, env(safe-area-inset-bottom, 0px)))',
        minHeight: 56,
      }}
    />
  );
}
