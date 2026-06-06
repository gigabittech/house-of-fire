'use client';

import { colors, fontFamilies } from '@hof/design-tokens';
import { HofLogoMark, HofPill } from '@hof/ui';
import { LandingChrome } from './LandingChrome';
import { useLandingLayout } from './useLandingLayout';

function StatusDot() {
  return (
    <span
      aria-hidden
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: colors.amber,
        boxShadow: `0 0 8px ${colors.amber}`,
        animation: 'hof-pulse 1.8s ease-in-out infinite',
        flexShrink: 0,
      }}
    />
  );
}

export function LandingUpcomingView() {
  const { isWide, isDesktop, pageColumn } = useLandingLayout();

  return (
    <LandingChrome centerHeader>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: isWide ? '24px 0 32px' : '16px 0 28px',
        }}
      >
        {/* Atmospheric photo wash */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <img
            src="/assets/photos/p3-portal-dj.jpg"
            alt=""
            style={{
              position: 'absolute',
              inset: '-8%',
              width: '116%',
              height: '116%',
              objectFit: 'cover',
              objectPosition: 'center 40%',
              opacity: 0.14,
              filter: 'blur(2px) saturate(0.85)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% 38%, rgba(232,101,26,0.14) 0%, rgba(10,10,8,0.55) 52%, ${colors.bg} 100%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, ${colors.bg} 0%, transparent 18%, transparent 82%, ${colors.bg} 100%)`,
            }}
          />
        </div>

        {/* Watermark emblem */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '46%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.045,
            pointerEvents: 'none',
          }}
        >
          <HofLogoMark size={isDesktop ? 320 : isWide ? 280 : 220} alt="" />
        </div>

        {/* Glow orb behind card */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: isDesktop ? 420 : isWide ? 360 : 300,
            height: isDesktop ? 420 : isWide ? 360 : 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,101,26,0.12) 0%, transparent 68%)',
            animation: 'hof-glow 4s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Center card */}
        <div
          style={{
            ...pageColumn,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: isDesktop ? 520 : isWide ? 480 : 400,
              padding: isWide ? '44px 40px 40px' : '36px 28px 32px',
              borderRadius: 16,
              background: `linear-gradient(155deg, rgba(232,101,26,0.07) 0%, ${colors.surface} 38%, ${colors.surface} 100%)`,
              border: `1px solid ${colors.border}`,
              boxShadow: '0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(240,237,230,0.04)',
              textAlign: 'center',
            }}
          >
            <div
              aria-hidden
              style={{
                width: 48,
                height: 2,
                margin: '0 auto 28px',
                borderRadius: 1,
                background: `linear-gradient(90deg, transparent, ${colors.amber}, transparent)`,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
              <HofPill tone="amber" size="sm" icon={<StatusDot />}>
                In preparation
              </HofPill>
            </div>

            <h1
              style={{
                fontFamily: fontFamilies.display,
                fontWeight: 700,
                fontSize: isDesktop ? 64 : isWide ? 56 : 48,
                color: colors.text,
                letterSpacing: '-0.03em',
                lineHeight: 0.92,
                textTransform: 'uppercase',
              }}
            >
              Upcoming
            </h1>

            <p
              style={{
                fontFamily: fontFamilies.body,
                fontSize: isWide ? 16 : 15,
                color: colors.textSec,
                marginTop: 18,
                lineHeight: 1.6,
                maxWidth: 380,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              We&apos;re preparing the next House of Fire experience. Stay tuned for upcoming event
              announcements.
            </p>

            <div
              aria-hidden
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 32,
              }}
            >
              <div style={{ flex: 1, height: 1, background: colors.border }} />
              <span
                style={{
                  fontFamily: fontFamilies.mono,
                  fontSize: 10,
                  color: colors.textDis,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                Boulder · CO
              </span>
              <div style={{ flex: 1, height: 1, background: colors.border }} />
            </div>
          </div>
        </div>
      </div>
    </LandingChrome>
  );
}
