'use client';

import { colors, layoutWidth } from '@hof/design-tokens';
import type { NavId, Post as UiPost } from '@hof/ui';
import { EmptyState, FeedPost, FeedSkeletonCard, HofAppShell, Icon, useResponsive } from '@hof/ui';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  countdownParts,
  eventDoorsTimestamp,
  formatEventDate,
  formatVenueLine,
  remainingTickets,
  resolveEventHeroImage,
  type UpcomingEvent,
} from '@/lib/eventDisplay';
import { photoSrc } from '../data/photos';
import { navHref } from '../lib/nav';

type ApiPost = {
  id: string;
  channel: string;
  title: string;
  body: string | null;
  is_anonymous: boolean;
  reply_count: number;
  reaction_counts: Record<string, number>;
  created_at: string;
  profiles: {
    handle: string;
    display_name: string;
    role: string;
    avatar_url: string | null;
  } | null;
};

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function apiPostToUi(p: ApiPost): UiPost {
  const displayName = p.is_anonymous
    ? 'Anonymous'
    : (p.profiles?.display_name ?? p.profiles?.handle ?? 'Member');
  const initials =
    displayName
      .split(' ')
      .map((w) => w[0] ?? '')
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  const role = (p.profiles?.role === 'crew' ? 'crew' : 'member') as 'crew' | 'member';
  const reactions: Partial<Record<'fire' | 'heart' | 'pray' | 'music' | 'eyes', number>> = {};
  for (const [k, v] of Object.entries(p.reaction_counts)) {
    if (['fire', 'heart', 'pray', 'music', 'eyes'].includes(k)) {
      (reactions as Record<string, number>)[k] = v;
    }
  }
  return {
    id: p.id,
    channel: p.channel,
    kind: 'quick',
    author: { name: displayName, initials, role },
    time: timeAgo(p.created_at),
    title: p.title || undefined,
    body: p.body ?? undefined,
    reactions,
    replyCount: p.reply_count,
  };
}

import CalendarSheet from '../sheets/CalendarSheet';
import NotificationsSheet from '../sheets/NotificationsSheet';

function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'warning' | 'gold' | 'amber';
}) {
  const bg =
    tone === 'warning'
      ? 'rgba(232,162,26,0.15)'
      : tone === 'gold'
        ? 'rgba(201,148,42,0.15)'
        : 'rgba(42,40,38,0.8)';
  const col = tone === 'warning' ? colors.warning : tone === 'gold' ? colors.gold : colors.textSec;
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 20,
        background: bg,
        border: `1px solid ${col}30`,
        fontFamily: 'Inter',
        fontSize: 11,
        fontWeight: 600,
        color: col,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}

function PrimaryBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      className="hof-btn hof-press"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        padding: '15px',
        background: colors.amber,
        border: `1px solid ${colors.amber}`,
        borderRadius: 12,
        fontFamily: 'Inter',
        fontWeight: 600,
        fontSize: 16,
        color: colors.bg,
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      className="hof-btn hof-press"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '15px',
        background: 'transparent',
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        fontFamily: 'Inter',
        fontWeight: 500,
        fontSize: 16,
        color: colors.text,
      }}
    >
      {children}
    </button>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [now, setNow] = useState(Date.now());
  const [calOpen, setCalOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [upcomingEvent, setUpcomingEvent] = useState<UpcomingEvent | null>(null);
  const [newsEmail, setNewsEmail] = useState('');
  const [newsSent, setNewsSent] = useState(false);
  const [topPosts, setTopPosts] = useState<UiPost[]>([]);
  const [topPostsLoading, setTopPostsLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/events/upcoming')
      .then((r) => r.json())
      .then((d) => {
        if (d.event) setUpcomingEvent(d.event);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setTopPostsLoading(true);
    fetch('/api/posts?channel=general&limit=3')
      .then((r) => r.json())
      .then((d: { posts?: ApiPost[] }) => {
        if (d.posts) setTopPosts(d.posts.map(apiPostToUi));
      })
      .catch(console.error)
      .finally(() => setTopPostsLoading(false));
  }, []);

  const left = remainingTickets(upcomingEvent?.ticket_tiers);
  const eventTs = upcomingEvent?.date
    ? eventDoorsTimestamp(upcomingEvent.date, upcomingEvent.doors_open)
    : Number.NaN;
  const countdown = countdownParts(eventTs, now);
  const { days: dd, hours: hh, minutes: mm, seconds: ss } = countdown;

  const { isWide, isDesktop } = useResponsive();

  const heroSrc = resolveEventHeroImage(upcomingEvent?.hero_image_url);

  const pageColumn: CSSProperties = useMemo(() => {
    const horizontalPad = isWide ? 32 : 16;
    const contentMaxWidth = isDesktop
      ? layoutWidth.appDesktop
      : isWide
        ? layoutWidth.app
        : undefined;
    return {
      width: '100%',
      maxWidth: contentMaxWidth,
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: horizontalPad,
      paddingRight: horizontalPad,
      boxSizing: 'border-box',
    };
  }, [isWide, isDesktop]);

  return (
    <HofAppShell active="home" onNav={(id: NavId) => router.push(navHref[id])}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: colors.bg,
          overflow: 'hidden',
        }}
      >
        {/* Sticky transparent top */}
        <div
          style={{
            position: 'absolute',
            top: isWide ? 12 : 54,
            left: 0,
            right: 0,
            zIndex: 10,
            padding: '12px 0',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              ...pageColumn,
              display: 'flex',
              alignItems: 'center',
              justifyContent: isWide ? 'flex-end' : 'space-between',
            }}
          >
          {!isWide && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  background: colors.amber,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="flame" size={14} color={colors.bg} />
              </div>
              <span
                style={{
                  fontFamily: 'Clash Display',
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: '0.18em',
                  color: colors.text,
                  textTransform: 'uppercase',
                }}
              >
                House of Fire
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="hof-btn hof-press"
              onClick={() => setCalOpen(true)}
              aria-label="Add to calendar"
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                background: 'rgba(20,20,18,0.7)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${colors.border}`,
                position: 'relative',
              }}
            >
              <Icon name="calendar" size={18} color={colors.text} />
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: colors.amber,
                  color: colors.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Inter',
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: '1',
                  border: `2px solid ${colors.bg}`,
                }}
              >
                +
              </span>
            </button>
            <button
              className="hof-btn hof-press"
              onClick={() => setNotifsOpen(true)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                background: 'rgba(20,20,18,0.7)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${colors.border}`,
                position: 'relative',
              }}
            >
              <Icon name="bell" size={18} color={colors.text} />
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: colors.amber,
                  border: `2px solid rgba(20,20,18,0.85)`,
                }}
              />
            </button>
          </div>
          </div>
        </div>

        {/* Scrollable content — hero full bleed; body in centered column */}
        <div
          className="hof-scroll"
          style={{
            position: 'absolute',
            inset: 0,
            overflowY: 'auto',
            paddingBottom: isWide ? 40 : 80,
          }}
        >
          {/* Hero — full-width cover image */}
          <div
            style={{
              position: 'relative',
              height: isDesktop ? 'min(62vh, 620px)' : isWide ? 580 : 540,
              overflow: 'hidden',
              width: '100%',
            }}
          >
            <img
              src={heroSrc}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 30%',
              }}
            />
            {/* warm vignette */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(ellipse at 50% 40%, rgba(232,101,26,0.0) 0%, rgba(10,10,8,0.5) 75%, #0A0A08 100%)',
              }}
            />
            {/* bottom gradient */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 360,
                background:
                  'linear-gradient(180deg, transparent 0%, rgba(10,10,8,0.85) 50%, #0A0A08 100%)',
              }}
            />

            {/* Hero content overlay */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <div style={{ ...pageColumn, paddingBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <Pill tone="warning">
                  <span
                    style={{
                      display: 'inline-block',
                      width: 5,
                      height: 5,
                      borderRadius: 5,
                      background: colors.bg,
                      marginRight: 4,
                      verticalAlign: 'middle',
                      animation: 'hof-pulse 1.4s ease-in-out infinite',
                    }}
                  />
                  Selling Fast · {left > 0 ? `${left} left` : 'Sold out'}
                </Pill>
                <Pill tone="neutral">Edition № {upcomingEvent?.edition_number ?? '—'}</Pill>
              </div>
              <Image
                src="/assets/hof-logo-color.png"
                alt="House of Fire"
                width={160}
                height={96}
                priority
                style={{
                  display: 'block',
                  marginLeft: -6,
                  filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.5))',
                }}
              />
              <div
                style={{
                  fontFamily: 'Clash Display',
                  fontWeight: 600,
                  fontSize: 26,
                  color: colors.text,
                  marginTop: 10,
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}
              >
                {upcomingEvent?.name ?? 'Next edition'}
                {upcomingEvent?.tagline ? (
                  <>
                    <br />
                    <span style={{ color: colors.glow, fontWeight: 500 }}>
                      {upcomingEvent.tagline}
                    </span>
                  </>
                ) : null}
              </div>
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: colors.textSec,
                  marginTop: 14,
                  letterSpacing: '0.04em',
                }}
              >
                {upcomingEvent
                  ? `${formatEventDate(upcomingEvent.date)} · ${formatVenueLine(upcomingEvent)}`
                  : 'Loading next edition…'}
              </div>
              </div>
            </div>
          </div>

          <div style={pageColumn}>
          {/* Countdown */}
          <div style={{ padding: '24px 0 8px' }}>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 11,
                color: colors.textSec,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              Doors in
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
              }}
            >
              {(
                [
                  ['Days', dd],
                  ['Hours', hh],
                  ['Min', mm],
                  ['Sec', ss],
                ] as [string, number][]
              ).map(([l, v]) => (
                <div
                  key={l}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: '14px 8px 10px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Clash Display',
                      fontWeight: 600,
                      fontSize: 30,
                      color: colors.text,
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {countdown.valid ? String(v).padStart(2, '0') : '—'}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 10,
                      color: colors.textSec,
                      textTransform: 'uppercase',
                      letterSpacing: '0.16em',
                      marginTop: 6,
                    }}
                  >
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div
            style={{
              padding: '16px 0 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <PrimaryBtn onClick={() => router.push('/checkout')}>
              <Icon name="ticket" size={18} color={colors.bg} />
              Get Tickets — from $20
            </PrimaryBtn>
            <GhostBtn onClick={() => router.push('/event')}>Event details</GhostBtn>
          </div>

          {/* Trust strip */}
          <div
            style={{
              marginTop: 24,
              padding: '16px 18px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
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
              <div key={l} style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontFamily: 'Clash Display',
                    fontWeight: 600,
                    fontSize: 22,
                    color: colors.text,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 11,
                    color: colors.textSec,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginTop: 2,
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>

          {/* About */}
          <div style={{ padding: '28px 0 8px' }}>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 10,
                color: colors.amber,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              What it is
            </div>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 500,
                fontSize: 22,
                lineHeight: 1.25,
                color: colors.text,
                letterSpacing: '-0.01em',
              }}
            >
              A monthly gathering of the people who keep coming back. Underground house and techno.
              One room. One night a month. Always at the Junkyard.
            </div>
          </div>

          {/* From the house */}
          <div style={{ padding: '32px 0 8px' }}>
            <div
              style={{
                padding: '0 16px',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 10,
                    color: colors.amber,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                  }}
                >
                  From the house
                </div>
                <div
                  style={{
                    fontFamily: 'Clash Display',
                    fontWeight: 600,
                    fontSize: 20,
                    color: colors.text,
                    marginTop: 4,
                    letterSpacing: '-0.01em',
                  }}
                >
                  What we&apos;re saying
                </div>
              </div>
              <button
                className="hof-btn"
                onClick={() => router.push('/community')}
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: colors.amber,
                  fontWeight: 500,
                }}
              >
                Open board →
              </button>
            </div>

            <div
              style={{
                padding: '0 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {topPostsLoading ? (
                [0, 1, 2].map((i) => <FeedSkeletonCard key={i} />)
              ) : topPosts.length === 0 ? (
                <EmptyState
                  title="Be the first to post"
                  body="The board is quiet."
                  action={
                    <button
                      className="hof-btn hof-press"
                      onClick={() => router.push('/community')}
                      style={{
                        padding: '10px 20px',
                        background: colors.amber,
                        border: `1px solid ${colors.amber}`,
                        borderRadius: 8,
                        fontFamily: 'Inter',
                        fontWeight: 600,
                        fontSize: 14,
                        color: colors.bg,
                      }}
                    >
                      Open board
                    </button>
                  }
                />
              ) : (
                topPosts.map((p) => (
                  <FeedPost
                    key={p.id}
                    post={p}
                    onOpen={() => router.push('/community/' + p.id)}
                    resolvePhoto={photoSrc}
                  />
                ))
              )}
            </div>
          </div>

          {/* Photo strip — from the last night */}
          <div style={{ padding: '28px 0 16px' }}>
            <div
              style={{
                padding: '0 16px',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 10,
                    color: colors.textSec,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                  }}
                >
                  From the last night
                </div>
                <div
                  style={{
                    fontFamily: 'Clash Display',
                    fontWeight: 600,
                    fontSize: 20,
                    color: colors.text,
                    marginTop: 4,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Edition 23 · May 30
                </div>
              </div>
              <span
                onClick={() => router.push('/community')}
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: colors.amber,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                See all →
              </span>
            </div>
            <div
              className="hof-scroll"
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                padding: '0 16px',
              }}
            >
              {[0, 1, 2, 3, 0].map((seed, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: '0 0 auto',
                    width: 150,
                    height: 200,
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: colors.elevated,
                    border: `1px solid ${colors.border}`,
                    position: 'relative',
                  }}
                >
                  <Image
                    src={photoSrc(seed)}
                    alt=""
                    fill
                    style={{
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      left: 8,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 10,
                      color: colors.text,
                      background: 'rgba(10,10,8,0.6)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    23 · {String(idx + 1).padStart(3, '0')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div
            style={{
              margin: '16px 16px 24px',
              padding: '20px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 18,
                color: colors.text,
                letterSpacing: '-0.01em',
                marginBottom: 6,
              }}
            >
              The Smoke Signal
            </div>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: colors.textSec,
                lineHeight: 1.5,
                marginBottom: 14,
              }}
            >
              One short message before each edition. Lineup, doors, dress code. Nothing else.
            </div>
            {newsSent ? (
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(232,101,26,0.1)',
                  border: `1px solid ${colors.amber}40`,
                  borderRadius: 8,
                  fontFamily: 'Inter',
                  fontSize: 14,
                  color: colors.amber,
                  fontWeight: 500,
                }}
              >
                You&apos;re on the list!
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={newsEmail}
                  onChange={(e) => setNewsEmail(e.target.value)}
                  style={{
                    flex: 1,
                    height: 44,
                    padding: '0 14px',
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
                  className="hof-btn hof-press"
                  onClick={async () => {
                    if (!newsEmail) return;
                    try {
                      await fetch('/api/newsletter/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: newsEmail }),
                      });
                    } catch {
                      // fire-and-forget — still show success to avoid UX friction
                    }
                    setNewsSent(true);
                    setNewsEmail('');
                  }}
                  style={{
                    padding: '0 18px',
                    height: 44,
                    background: colors.amber,
                    border: `1px solid ${colors.amber}`,
                    borderRadius: 8,
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: 14,
                    color: colors.bg,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Subscribe
                </button>
              </div>
            )}
          </div>

          <div style={{ height: 24 }} />
          </div>
        </div>

        <CalendarSheet
          open={calOpen}
          onClose={() => setCalOpen(false)}
          event={upcomingEvent ?? undefined}
        />
        <NotificationsSheet
          open={notifsOpen}
          onClose={() => setNotifsOpen(false)}
          onOpenPost={(id) => {
            setNotifsOpen(false);
            router.push('/community/' + id);
          }}
        />
      </div>
    </HofAppShell>
  );
}
