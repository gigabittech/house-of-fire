'use client';

import { colors, layoutChrome } from '@hof/design-tokens';
import type { ReactNode } from 'react';
import { hofChromeCircleBtn, hofChromeIconRow } from './hofChromeIcon';
import { Icon } from './Icon';

const DEFAULT_HOME_ICON = '/assets/icon.png';

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

export interface HofMobilePageHeaderProps {
  title: string;
  actions?: ReactNode;
  onBack?: () => void;
  homeHref?: string;
  homeIconSrc?: string;
}

/** Mobile page bar — home icon (left), back + actions in single circles (right). */
export function HofMobilePageHeader({
  title,
  actions,
  onBack,
  homeHref = '/',
  homeIconSrc = DEFAULT_HOME_ICON,
}: HofMobilePageHeaderProps) {
  const hasRight = Boolean(onBack || actions);

  return (
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        paddingTop: layoutChrome.mobileHeaderTop,
        paddingBottom: 8,
        paddingLeft: 14,
        paddingRight: 14,
        background:
          'linear-gradient(180deg, rgba(10,10,8,0.88) 0%, rgba(10,10,8,0.45) 55%, transparent 100%)',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      <span style={visuallyHidden}>{title}</span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          minHeight: hofChromeCircleBtn.height,
          pointerEvents: 'auto',
        }}
      >
        <a
          href={homeHref}
          aria-label="Home"
          className="hof-btn hof-press"
          style={hofChromeCircleBtn}
        >
          <img
            src={homeIconSrc}
            alt=""
            style={{ width: 30, height: 30, display: 'block', objectFit: 'contain' }}
          />
        </a>

        {hasRight ? (
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
            {actions}
          </div>
        ) : (
          <div style={{ width: hofChromeCircleBtn.width }} aria-hidden />
        )}
      </div>
    </header>
  );
}
