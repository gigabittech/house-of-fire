'use client';

import { colors, layoutWidth } from '@hof/design-tokens';
import { HofButton, HofLogoMark, HofPill, Icon, useResponsive } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { photoSrc } from '../data/photos.js';
import { createClient } from '../lib/supabase.js';

/** Shared horizontal track — every section uses this for aligned edges. */
function useLandingLayout() {
  const { isWide, isDesktop } = useResponsive();
  const horizontalPad = isWide ? 32 : 16;
  const contentMaxWidth = isDesktop
    ? layoutWidth.marketingDesktop
    : isWide
      ? layoutWidth.marketingTablet
      : undefined;

  const pageColumn: CSSProperties = {
    width: '100%',
    maxWidth: contentMaxWidth,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: horizontalPad,
    paddingRight: horizontalPad,
    boxSizing: 'border-box',
  };

  return { isWide, isDesktop, horizontalPad, pageColumn };
}

function LandingSection({
  children,
  pageColumn,
  style,
}: {
  children: ReactNode;
  pageColumn: CSSProperties;
  style?: CSSProperties;
}) {
  return <div style={{ ...pageColumn, ...style }}>{children}</div>;
}

export default function LandingScreen() {
  const router = useRouter();
  const supabase = createClient();
  const { isWide, isDesktop, pageColumn } = useLandingLayout();
  const [signingIn, setSigningIn] = useState(false);
  const [siEmail, setSiEmail] = useState('');
  const [siSent, setSiSent] = useState(false);
  const [siLoading, setSiLoading] = useState(false);

  const onGetStarted = () => router.push('/onboarding');
  const onSignIn = () => setSigningIn(true);

  const sectionLabel: CSSProperties = {
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.amber,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    marginBottom: 10,
  };

  const surfaceCard: CSSProperties = {
    width: '100%',
    padding: isWide ? 20 : 16,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
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
        }}
      >
        {/* Hero — full-bleed image; chrome + copy share pageColumn */}
        <div
          style={{
            position: 'relative',
            height: isDesktop ? 'min(72vh, 720px)' : isWide ? 680 : 620,
            overflow: 'hidden',
          }}
        >
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
            {/* Top bar */}
            <div
              style={{
                ...pageColumn,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: isWide ? 12 : 54,
                paddingBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HofLogoMark size={22} />
                <span
                  style={{
                    fontFamily: 'Clash Display',
                    fontWeight: 600,
                    fontSize: 12,
                    letterSpacing: '0.22em',
                    color: colors.text,
                    textTransform: 'uppercase',
                  }}
                >
                  House of Fire
                </span>
              </div>
              <button
                type="button"
                className="hof-btn hof-press"
                onClick={onSignIn}
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: 500,
                  color: colors.text,
                  padding: '8px 14px',
                  borderRadius: 6,
                  background: 'rgba(20,20,18,0.6)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${colors.border}`,
                }}
              >
                Sign in
              </button>
            </div>

            {/* Sign-in overlay */}
            {signingIn && (
              <div
                style={{
                  flexShrink: 0,
                  background: colors.surface,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ ...pageColumn, paddingTop: 16, paddingBottom: 20 }}>
                  {!siSent ? (
                    <>
                      <div
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 13,
                          color: colors.textSec,
                          marginBottom: 10,
                        }}
                      >
                        Enter your email — we&apos;ll send a sign-in link.
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="email"
                          value={siEmail}
                          onChange={(e) => setSiEmail(e.target.value)}
                          placeholder="you@example.com"
                          style={{
                            flex: 1,
                            height: 44,
                            padding: '0 12px',
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            fontFamily: 'Inter',
                            fontSize: 14,
                            color: colors.text,
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          className="hof-btn hof-press"
                          disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siEmail) || siLoading}
                          onClick={async () => {
                            setSiLoading(true);
                            await supabase.auth.signInWithOtp({
                              email: siEmail,
                              options: {
                                emailRedirectTo: `${window.location.origin}/auth/callback`,
                              },
                            });
                            setSiLoading(false);
                            setSiSent(true);
                          }}
                          style={{
                            padding: '0 16px',
                            background: colors.amber,
                            border: 'none',
                            borderRadius: 8,
                            fontFamily: 'Inter',
                            fontWeight: 600,
                            fontSize: 13,
                            color: colors.bg,
                            opacity: siLoading ? 0.6 : 1,
                            cursor:
                              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siEmail) && !siLoading
                                ? 'pointer'
                                : 'not-allowed',
                          }}
                        >
                          {siLoading ? '…' : 'Send link'}
                        </button>
                        <button
                          type="button"
                          className="hof-btn"
                          onClick={() => {
                            setSigningIn(false);
                            setSiEmail('');
                            setSiSent(false);
                          }}
                          style={{
                            padding: '0 12px',
                            background: 'transparent',
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            color: colors.textSec,
                            cursor: 'pointer',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: 'Inter',
                            fontWeight: 500,
                            fontSize: 14,
                            color: colors.text,
                          }}
                        >
                          Check your email
                        </div>
                        <div
                          style={{
                            fontFamily: 'Inter',
                            fontSize: 12,
                            color: colors.textSec,
                            marginTop: 2,
                          }}
                        >
                          Sent to {siEmail}. Click the link to sign in.
                        </div>
                      </div>
                      <button
                        type="button"
                        className="hof-btn"
                        onClick={() => {
                          setSigningIn(false);
                          setSiEmail('');
                          setSiSent(false);
                        }}
                        style={{
                          padding: '8px',
                          background: 'transparent',
                          border: 'none',
                          color: colors.textSec,
                          fontSize: 16,
                          cursor: 'pointer',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hero copy — pinned to bottom of hero, same column */}
            <div style={{ flex: 1 }} />
            <div style={{ ...pageColumn, paddingBottom: 28 }}>
              <HofPill tone="amber" size="sm">
                Boulder · Monthly
              </HofPill>
              <div
                style={{
                  fontFamily: 'Clash Display',
                  fontWeight: 700,
                  fontSize: isDesktop ? 56 : isWide ? 52 : 44,
                  color: colors.text,
                  marginTop: 14,
                  letterSpacing: '-0.02em',
                  lineHeight: 0.95,
                  textTransform: 'uppercase',
                  maxWidth: isDesktop ? 900 : isWide ? 640 : undefined,
                }}
              >
                The room that keeps the floor full.
              </div>
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: isWide ? 16 : 15,
                  color: colors.textSec,
                  marginTop: 14,
                  lineHeight: 1.5,
                  maxWidth: isDesktop ? 520 : isWide ? 420 : 320,
                }}
              >
                Underground house and techno. One room. One night a month. Tickets sell out, every
                time. <span style={{ color: colors.text }}>You should be here.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Below hero — single aligned column for all sections */}
        <LandingSection pageColumn={pageColumn} style={{ paddingTop: 24 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              ...(isWide ? { flexDirection: 'row' } : {}),
            }}
          >
            <HofButton
              variant="primary"
              full={!isWide}
              onClick={onGetStarted}
              icon={<Icon name="flame" size={18} color={colors.bg} />}
              style={isWide ? { flex: 1, width: 'auto' } : undefined}
            >
              Become a member — free
            </HofButton>
            <HofButton
              variant="ghost"
              full={!isWide}
              onClick={onGetStarted}
              style={isWide ? { flex: 1, width: 'auto' } : undefined}
            >
              Browse the next event
            </HofButton>
          </div>
        </LandingSection>

        <LandingSection pageColumn={pageColumn} style={{ paddingTop: 24 }}>
          <div
            style={{
              ...surfaceCard,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {(
              [
                ['24', 'editions'],
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

        <LandingSection pageColumn={pageColumn} style={{ paddingTop: 32 }}>
          <div style={sectionLabel}>What it is</div>
          <div
            style={{
              fontFamily: 'Clash Display',
              fontWeight: 500,
              fontSize: isWide ? 24 : 22,
              lineHeight: 1.25,
              color: colors.text,
              letterSpacing: '-0.01em',
              maxWidth: isDesktop ? 720 : undefined,
            }}
          >
            A monthly gathering of the people who keep coming back. Underground house and techno.
            One room. Always at the Junkyard.
          </div>
        </LandingSection>

        <LandingSection pageColumn={pageColumn} style={{ paddingTop: 32 }}>
          <div style={{ ...sectionLabel, marginBottom: 14 }}>How it works</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr',
              gap: isDesktop ? 20 : 14,
            }}
          >
            {(
              [
                ['01', 'Become a member', 'Free. 30 seconds. Email + phone.'],
                ['02', 'Buy a ticket', 'Edition by edition. They go fast.'],
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

        <LandingSection pageColumn={pageColumn} style={{ paddingTop: 32 }}>
          <div style={{ ...sectionLabel, marginBottom: 12 }}>From the last 3 editions</div>
          <div
            className="hof-scroll"
            style={{
              display: 'flex',
              gap: isWide ? 10 : 6,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {([0, 1, 2, 3, 0, 1] as number[]).map((s, i) => (
              <div
                key={i}
                style={{
                  flex: '0 0 auto',
                  width: isDesktop ? 280 : isWide ? 240 : 200,
                  height: isDesktop ? 340 : isWide ? 300 : 260,
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
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

        <LandingSection pageColumn={pageColumn} style={{ paddingTop: 32, paddingBottom: 16 }}>
          <div
            style={{
              ...surfaceCard,
              borderRadius: 14,
              padding: isWide ? 24 : 22,
              background: `linear-gradient(135deg, rgba(232,101,26,0.15) 0%, ${colors.surface} 60%)`,
            }}
          >
            <div style={{ ...sectionLabel, marginBottom: 6 }}>Next edition</div>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 26,
                color: colors.text,
                letterSpacing: '-0.01em',
              }}
            >
              Fireversary — Edition 24
            </div>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: colors.textSec,
                marginTop: 6,
              }}
            >
              Friday, June 26 · Junkyard · 47 GA tickets left
            </div>
            <div style={{ marginTop: 16 }}>
              <HofButton
                variant="primary"
                full
                onClick={onGetStarted}
                icon={<Icon name="ticket" size={16} color={colors.bg} />}
              >
                Sign up &amp; get tickets
              </HofButton>
            </div>
          </div>
        </LandingSection>

        <LandingSection
          pageColumn={pageColumn}
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
