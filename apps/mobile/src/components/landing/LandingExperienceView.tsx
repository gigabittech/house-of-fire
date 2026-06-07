'use client';

import { colors } from '@hof/design-tokens';
import { HofButton, HofLogoMark, HofPill, Icon } from '@hof/ui';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import {
  formatEventDate,
  NO_EVENTS_MESSAGE,
  remainingTickets,
  type UpcomingEvent,
} from '@/lib/eventDisplay';
import { useAuthNavigation } from '@/components/auth/AuthNavigation';
import { photoSrc } from '@/data/photos';
import { useLandingLayout } from './useLandingLayout';

function LandingSection({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

/** Full marketing landing — shown when a live event is active. */
export function LandingExperienceView() {
  const { navigate } = useAuthNavigation();
  const { pageColumnClassName } = useLandingLayout();
  const [upcoming, setUpcoming] = useState<UpcomingEvent | null>(null);
  const [eventLoaded, setEventLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/events/upcoming')
      .then((r) => r.json())
      .then((d) => {
        if (d.event) setUpcoming(d.event);
      })
      .catch(console.error)
      .finally(() => setEventLoaded(true));
  }, []);

  const onGetStarted = () => navigate('/onboarding');
  const onSignIn = () => navigate('/sign-in');

  const sectionLabel: CSSProperties = {
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.amber,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    marginBottom: 10,
  };

  const surfaceCard: CSSProperties = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: colors.bg,
      }}
    >
      <div
        className="hof-scroll"
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          paddingBottom: 40,
        }}
      >
        <div className="hof-landing-hero">
          <img
            src="/assets/photos/p3-portal-dj.jpg"
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 35%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 50% 30%, rgba(232,101,26,0.0) 0%, rgba(10,10,8,0.55) 70%, #0A0A08 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 420,
              background:
                'linear-gradient(180deg, transparent 0%, rgba(10,10,8,0.92) 50%, #0A0A08 100%)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              className={pageColumnClassName}
              style={{
                paddingTop: `calc(12px + env(safe-area-inset-top, 0px))`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0,
              }}
            >
              <div className="hof-landing-logo">
                <HofLogoMark
                  fit="wordmark"
                  src="/assets/hof-logo.png"
                  width={112}
                  alt="House of Fire"
                />
              </div>
              <HofButton
                variant="ghost"
                size="sm"
                onClick={onSignIn}
                style={{
                  flexShrink: 0,
                  height: 40,
                  padding: '0 18px',
                  borderRadius: 999,
                  background: 'rgba(20,20,18,0.72)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: `1px solid ${colors.borderHi}`,
                  boxShadow: '0 2px 14px rgba(0,0,0,0.28)',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                Sign in
              </HofButton>
            </div>

            <div style={{ flex: 1 }} />
            <div className={pageColumnClassName} style={{ paddingBottom: 28 }}>
              <HofPill tone="amber" size="sm">
                Boulder · Monthly
              </HofPill>
              <div className="hof-landing-hero-title" style={{ color: colors.text }}>
                The room that keeps the floor full.
              </div>
              <div className="hof-landing-hero-subtitle" style={{ color: colors.textSec }}>
                Underground house and techno. One room. One night a month. Tickets sell out, every
                time. <span style={{ color: colors.text }}>You should be here.</span>
              </div>
            </div>
          </div>
        </div>

        <LandingSection className={pageColumnClassName} style={{ paddingTop: 24 }}>
          <div className="hof-landing-cta-row">
            <HofButton
              variant="primary"
              full
              onClick={onGetStarted}
              icon={<Icon name="flame" size={18} color={colors.bg} />}
            >
              Become a member — free
            </HofButton>
            <HofButton variant="ghost" full onClick={onGetStarted}>
              Browse the next event
            </HofButton>
          </div>
        </LandingSection>

        <LandingSection className={pageColumnClassName} style={{ paddingTop: 24 }}>
          <div
            className="hof-landing-surface-card"
            style={{
              ...surfaceCard,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {(
              [
                ['24', 'themes'],
                ['7,200+', 'attended'],
                ['62%', 'return rate'],
              ] as [string, string][]
            ).map(([n, l]) => (
              <div key={l}>
                <div
                  style={{
                    fontFamily: 'Clash Display',
                    fontWeight: 600,
                    fontSize: 22,
                    color: colors.text,
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 10,
                    color: colors.textSec,
                    marginTop: 2,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </LandingSection>

        <LandingSection className={pageColumnClassName} style={{ paddingTop: 32 }}>
          <div style={sectionLabel}>What it is</div>
          <div className="hof-landing-section-heading" style={{ color: colors.text }}>
            A monthly gathering of the people who keep coming back. Underground house and techno.
            One room. Always at the Junkyard.
          </div>
        </LandingSection>

        <LandingSection className={pageColumnClassName} style={{ paddingTop: 32 }}>
          <div style={{ ...sectionLabel, marginBottom: 14 }}>How it works</div>
          <div className="hof-landing-steps-grid">
            {(
              [
                ['01', 'Become a member', 'Free. 30 seconds. Email + phone.'],
                ['02', 'Buy a ticket', 'Theme by theme. They go fast.'],
                ['03', 'Show your QR at the door', "Don't lose it. Don't share it."],
                ['04', 'Find your people', 'Channels, recaps, photos, the whole house.'],
              ] as [string, string, string][]
            ).map(([n, t, s]) => (
              <div key={n} style={{ display: 'flex', gap: 14 }}>
                <div
                  style={{
                    fontFamily: 'Clash Display',
                    fontWeight: 600,
                    fontSize: 28,
                    color: colors.amber,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    width: 40,
                    flexShrink: 0,
                  }}
                >
                  {n}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontSize: 15,
                      color: colors.text,
                    }}
                  >
                    {t}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 13,
                      color: colors.textSec,
                      marginTop: 2,
                    }}
                  >
                    {s}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </LandingSection>

        <LandingSection className={pageColumnClassName} style={{ paddingTop: 32 }}>
          <div style={{ ...sectionLabel, marginBottom: 12 }}>From the last 3 themes</div>
          <div className="hof-scroll hof-landing-photo-strip">
            {([0, 1, 2, 3, 0, 1] as number[]).map((s, i) => (
              <div key={i} className="hof-landing-photo-tile">
                <img
                  src={photoSrc(s)}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            ))}
          </div>
        </LandingSection>

        <LandingSection className={pageColumnClassName} style={{ paddingTop: 32, paddingBottom: 16 }}>
          <div
            className="hof-landing-surface-card hof-landing-promo-card"
            style={{
              ...surfaceCard,
              background: `linear-gradient(135deg, rgba(232,101,26,0.15) 0%, ${colors.surface} 60%)`,
            }}
          >
            <div style={{ ...sectionLabel, marginBottom: 6 }}>
              {upcoming ? 'Next theme' : 'House of Fire'}
            </div>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 26,
                color: colors.text,
                letterSpacing: '-0.01em',
              }}
            >
              {upcoming
                ? `${upcoming.name} — Theme ${upcoming.edition_number}`
                : eventLoaded
                  ? NO_EVENTS_MESSAGE
                  : 'Next theme'}
            </div>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: colors.textSec,
                marginTop: 6,
              }}
            >
              {upcoming
                ? `${formatEventDate(upcoming.date)} · ${upcoming.venue_name} · ${remainingTickets(upcoming.ticket_tiers)} tickets left`
                : eventLoaded
                  ? ''
                  : 'Loading…'}
            </div>
            {upcoming ? (
              <div style={{ marginTop: 16 }}>
                <HofButton
                  variant="primary"
                  full
                  onClick={onGetStarted}
                  icon={<Icon name="ticket" size={16} color={colors.bg} />}
                >
                  Sign up & get tickets
                </HofButton>
              </div>
            ) : eventLoaded ? null : (
              <div style={{ marginTop: 16 }}>
                <HofButton variant="primary" full onClick={onGetStarted}>
                  Get started
                </HofButton>
              </div>
            )}
          </div>
        </LandingSection>

        <LandingSection
          className={pageColumnClassName}
          style={{
            paddingTop: 20,
            paddingBottom: 40,
            fontFamily: 'Inter',
            fontSize: 11,
            color: colors.textDis,
            letterSpacing: '0.12em',
          }}
        >
          houseoffire.events · Boulder, CO
        </LandingSection>
      </div>
    </div>
  );
}
