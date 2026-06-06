'use client';

import { colors, fontFamilies, layoutChrome } from '@hof/design-tokens';
import { Avatar } from './feed/Avatar';
import { HofLogoMark } from './HofLogoMark';
import { useResponsive } from './useBreakpoint';

export interface HofAppHeaderUser {
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface HofAppHeaderProps {
  user?: HofAppHeaderUser | null;
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

/** Shared top bar — full wordmark; signed-in user on mobile header only. */
export function HofAppHeader({ user }: HofAppHeaderProps) {
  const { isWide } = useResponsive();

  return (
    <header
      style={{
        flexShrink: 0,
        zIndex: 40,
        background: 'rgba(10,10,8,0.92)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        borderBottom: `1px solid ${colors.border}`,
        paddingTop: layoutChrome.mobileHeaderTop,
        paddingLeft: isWide ? 16 : 12,
        paddingRight: isWide ? 16 : 12,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          minHeight: layoutChrome.headerRowHeight,
          paddingBottom: 6,
        }}
      >
        <HofLogoMark fit="wordmark" width={isWide ? 118 : 108} alt="House of Fire" />
        {!isWide && user ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
              maxWidth: '48%',
            }}
          >
            <div style={{ textAlign: 'right', minWidth: 0 }}>
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
            <Avatar
              initials={initialsFromName(user.name)}
              src={user.avatarUrl}
              alt={user.name}
              size={28}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
