'use client';

import { colors, layoutChrome, layoutWidth, spacing } from '@hof/design-tokens';
import type { Post as UiPost } from '@hof/ui';
import { EmptyState, FeedPost, FeedSkeletonCard, Icon, useResponsive } from '@hof/ui';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react';
import { useCommunityRealtime } from '@/hooks/useCommunityRealtime';
import { INVENTORY_POLL_MS, useEventInventory } from '@/hooks/useEventInventory';
import { AppHeaderIconButton } from '@/components/AppHeaderIconButton';
import { EventHeroBackground } from '@/components/EventHeroBackground';
import { useAppHeader } from '@/hooks/useAppHeader';
import { COMMUNITY_FEATURE_ENABLED } from '@/lib/features';
import {
  countdownParts,
  eventDoorsTimestamp,
  eventInventoryBadgeLabel,
  eventInventoryBadgeTone,
  formatEventDate,
  formatEventDateShort,
  formatVenueLine,
  NO_EVENTS_MESSAGE,
  resolveEventHeroImage,
  type UpcomingEvent,
} from '@/lib/eventDisplay';
import { archiveThemePath } from '@/lib/resolveEventSlug';
import { photoSrc } from '../data/photos';
import { apiPostToUi, type ApiPost } from '../lib/postUi';
import CalendarSheet from '../sheets/CalendarSheet';
import NotificationsSheet from '../sheets/NotificationsSheet';

function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'warning' | 'gold' | 'amber' | 'success';
}) {
  const bg =
    tone === 'warning'
      ? 'rgba(232,162,26,0.15)'
      : tone === 'gold'
        ? 'rgba(201,148,42,0.15)'
        : tone === 'success'
          ? 'rgba(76,175,110,0.15)'
          : 'rgba(42,40,38,0.8)';
  const col =
    tone === 'warning'
      ? colors.warning
      : tone === 'gold'
        ? colors.gold
        : tone === 'success'
          ? colors.success
          : colors.textSec;
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
  const [eventLoaded, setEventLoaded] = useState(false);
  const [newsEmail, setNewsEmail] = useState('');
  const [newsSent, setNewsSent] = useState(false);
  const [topPosts, setTopPosts] = useState<UiPost[]>([]);
  const [topPostsLoading, setTopPostsLoading] = useState(true);
  const [lastNight, setLastNight] = useState<{
    event: { edition_number: number; name: string; date: string };
    photos: Array<{ id: string; public_url: string | null; thumb_url?: string | null }>;
  } | null>(null);
  const [lastNightLoading, setLastNightLoading] = useState(true);

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
      .catch(console.error)
      .finally(() => setEventLoaded(true));
  }, []);

  useEventInventory({
    event: upcomingEvent,
    onEventChange: setUpcomingEvent,
    enabled: eventLoaded,
    pollIntervalMs: INVENTORY_POLL_MS.home,
  });

  const loadTopPosts = useCallback(() => {
    setTopPostsLoading(true);
    fetch('/api/posts?channel=general&limit=3')
      .then((r) => r.json())
      .then((d: { posts?: ApiPost[] }) => {
        if (d.posts) setTopPosts(d.posts.map(apiPostToUi));
      })
      .catch(console.error)
      .finally(() => setTopPostsLoading(false));
  }, []);

  const patchTopPost = useCallback(
    (row: { id: string; reaction_counts?: Record<string, number>; reply_count?: number }) => {
      setTopPosts((prev) =>
        prev.map((p) =>
          p.id === row.id
            ? {
                ...p,
                reactions: row.reaction_counts ?? p.reactions,
                replyCount: row.reply_count ?? p.replyCount,
              }
            : p,
        ),
      );
    },
    [],
  );

  useCommunityRealtime({
    channel: 'general',
    onPostInsert: async (row) => {
      try {
        const r = await fetch(`/api/posts/${row.id}`);
        if (!r.ok) return;
        const d = (await r.json()) as { post?: ApiPost };
        if (!d.post) return;
        setTopPosts((prev) => {
          const next = [apiPostToUi(d.post!), ...prev.filter((p) => p.id !== d.post!.id)];
          return next.slice(0, 3);
        });
      } catch {
        /* keep list */
      }
    },
    onPostUpdate: (row) => patchTopPost(row),
    onPostDelete: (oldRow) => {
      if (oldRow.id) setTopPosts((prev) => prev.filter((p) => p.id !== oldRow.id));
    },
    onResync: () => loadTopPosts(),
    enabled: COMMUNITY_FEATURE_ENABLED,
  });

  useEffect(() => {
    setLastNightLoading(true);
    fetch('/api/events/last-night')
      .then((r) => r.json())
      .then((d: {
        event?: { edition_number: number; name: string; date: string } | null;
        photos?: Array<{ id: string; public_url: string | null; thumb_url?: string | null }>;
      }) => {
        if (d.event) {
          setLastNight({ event: d.event, photos: d.photos ?? [] });
        } else {
          setLastNight(null);
        }
      })
      .catch(console.error)
      .finally(() => setLastNightLoading(false));
  }, []);

  useEffect(() => {
    loadTopPosts();
  }, [loadTopPosts]);

  const inventoryBadgeLabel = eventInventoryBadgeLabel(
    upcomingEvent ?? { status: 'upcoming' },
    upcomingEvent?.ticket_tiers,
  );
  const inventoryBadgeTone = eventInventoryBadgeTone(
    upcomingEvent ?? { status: 'upcoming' },
    upcomingEvent?.ticket_tiers,
  );
  const eventTs = upcomingEvent?.date
    ? eventDoorsTimestamp(upcomingEvent.date, upcomingEvent.doors_open)
    : Number.NaN;
  const countdown = countdownParts(eventTs, now);
  const { days: dd, hours: hh, minutes: mm, seconds: ss } = countdown;

  const { isWide, isDesktop, isMobile } = useResponsive();

  const heroSrc = resolveEventHeroImage(upcomingEvent?.hero_image_url);
  const sectionPad = isMobile ? `${spacing[5]}px 0 ${spacing[1]}px` : `${spacing[6]}px 0 ${spacing[2]}px`;

  const headerActions = useMemo(
    () => (
      <>
        <AppHeaderIconButton
          icon="calendar"
          label="Add to calendar"
          onClick={() => setCalOpen(true)}
          badge={
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: 6,
                background: colors.amber,
                color: colors.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter',
                fontSize: 9,
                fontWeight: 700,
                lineHeight: '1',
                border: `2px solid ${colors.bg}`,
              }}
            >
              +
            </span>
          }
        />
        <AppHeaderIconButton
          icon="bell"
          label="Notifications"
          onClick={() => setNotifsOpen(true)}
          badge={
            <span
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 7,
                height: 7,
                borderRadius: 4,
                background: colors.amber,
                border: `2px solid ${colors.surface}`,
              }}
            />
          }
        />
      </>
    ),
    [],
  );

  useAppHeader({ title: 'Home', actions: headerActions });

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
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: colors.bg,
          overflow: 'hidden',
        }}
      >
        {/* Scrollable content — hero full bleed; body in centered column */}
        <div
          className="hof-scroll hof-app-page-scroll"
          style={{
            position: 'absolute',
            inset: 0,
            overflowY: 'auto',
            paddingBottom: isWide ? layoutChrome.wideScrollBottom : layoutChrome.mobileScrollBottom,
          }}
        >
          <EventHeroBackground src={heroSrc}>
              <div style={{ ...pageColumn, paddingBottom: spacing[3] }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: spacing[3],
                }}
              >
                <Pill tone={inventoryBadgeTone}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 5,
                      height: 5,
                      borderRadius: 5,
                      background: inventoryBadgeTone === 'success' ? colors.success : colors.bg,
                      marginRight: 4,
                      verticalAlign: 'middle',
                      animation:
                        inventoryBadgeTone === 'neutral'
                          ? undefined
                          : 'hof-pulse 1.4s ease-in-out infinite',
                    }}
                  />
                  {inventoryBadgeLabel}
                </Pill>
                <Pill tone="neutral">Theme № {upcomingEvent?.edition_number ?? '—'}</Pill>
              </div>
              <div
                style={{
                  fontFamily: 'Clash Display',
                  fontWeight: 600,
                  fontSize: 26,
                  color: colors.text,
                  marginTop: 4,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                  textTransform: 'uppercase',
                }}
              >
                {upcomingEvent?.name ?? (eventLoaded ? NO_EVENTS_MESSAGE : 'Next theme')}
                {upcomingEvent?.tagline ? (
                  <span
                    style={{
                      display: 'block',
                      marginTop: spacing[2],
                      color: colors.glow,
                      fontWeight: 500,
                    }}
                  >
                    {upcomingEvent.tagline}
                  </span>
                ) : null}
              </div>
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: colors.textSec,
                  marginTop: spacing[3],
                  letterSpacing: '0.04em',
                }}
              >
                {upcomingEvent
                  ? `${formatEventDate(upcomingEvent.date)} · ${formatVenueLine(upcomingEvent)}`
                  : eventLoaded
                    ? ''
                    : 'Loading next theme…'}
              </div>
              </div>
          </EventHeroBackground>

          <div style={pageColumn}>
          {/* Countdown */}
          <div style={{ padding: sectionPad }}>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 11,
                color: colors.textSec,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: spacing[3],
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
              padding: `${spacing[3]}px 0 ${spacing[1]}px`,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[2],
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
              marginTop: spacing[5],
              padding: `${spacing[4]}px ${spacing[4]}px`,
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
                ['24', 'themes'],
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
          <div style={{ padding: sectionPad }}>
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

          {/* From the house — COMMUNITY_FEATURE */}
          {COMMUNITY_FEATURE_ENABLED ? (
          <div style={{ padding: sectionPad }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: spacing[3],
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
                    pressFeedback={false}
                  />
                ))
              )}
            </div>
          </div>
          ) : null}

          {/* Photo strip — from the last night */}
          {!lastNightLoading && lastNight ? (
          <div style={{ padding: `${spacing[5]}px 0 ${spacing[4]}px` }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: spacing[3],
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
                  Theme {lastNight.event.edition_number} ·{' '}
                  {formatEventDateShort(lastNight.event.date)}
                </div>
              </div>
              <span
                onClick={() => router.push('/archive')}
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
              }}
            >
              {(lastNight.photos.length > 0
                ? lastNight.photos.map((photo, idx) => ({
                    key: photo.id,
                    src: photo.thumb_url ?? photo.public_url ?? photoSrc(idx),
                    idx,
                  }))
                : [0, 1, 2, 3].map((seed, idx) => ({
                    key: `placeholder-${seed}-${idx}`,
                    src: photoSrc(seed),
                    idx,
                  }))
              ).map(({ key, src, idx }) => (
                <button
                  key={key}
                  type="button"
                  className="hof-btn hof-press"
                  onClick={() => router.push(archiveThemePath(lastNight.event.edition_number))}
                  style={{
                    flex: '0 0 auto',
                    width: 150,
                    height: 200,
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: colors.elevated,
                    border: `1px solid ${colors.border}`,
                    position: 'relative',
                    padding: 0,
                  }}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    unoptimized={src.startsWith('http')}
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
                    {lastNight.event.edition_number} · {String(idx + 1).padStart(3, '0')}
                  </div>
                </button>
              ))}
            </div>
          </div>
          ) : null}

          {/* Newsletter */}
          <div
            style={{
              margin: `${spacing[4]}px 0 ${spacing[5]}px`,
              padding: spacing[5],
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
              One short message before each theme. Lineup, doors, dress code. Nothing else.
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

          <div style={{ height: spacing[2] }} />
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
          onOpenPost={
            COMMUNITY_FEATURE_ENABLED
              ? (id) => {
                  setNotifsOpen(false);
                  router.push('/community/' + id);
                }
              : undefined
          }
        />
      </div>
  );
}
