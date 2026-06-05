'use client';

import { colors, layoutWidth } from '@hof/design-tokens';
import type { IconName } from '@hof/ui';
import {
  Avatar,
  EmptyState,
  ErrorState,
  FakeQR,
  FeedSkeletonCard,
  HofPill,
  Icon,
  useResponsive,
} from '@hof/ui';
import { useRouter } from 'next/navigation';
import { COMMUNITY_FEATURE_ENABLED } from '@/lib/features';
import { useEffect, useState } from 'react';
import { useAppHeader } from '@/hooks/useAppHeader';
import { NO_EVENTS_MESSAGE } from '@/lib/eventDisplay';
import { MapSheet } from '../sheets/MapSheet';

// ── API response shapes ────────────────────────────────────────────────────

interface ApiProfile {
  handle: string;
  display_name: string;
  role: 'member' | 'crew' | 'admin';
  avatar_url: string | null;
}

interface ApiPost {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
  is_anonymous: boolean;
  profiles: ApiProfile | null;
}

interface ApiArtist {
  name: string;
}

interface ApiLineupEntry {
  artist: ApiArtist;
  set_time: string | null;
  role: 'headliner' | 'opener' | 'resident' | 'performer';
  sort_order: number;
}

interface ApiEvent {
  id: string;
  edition_number: number;
  name: string;
}

interface ApiTicket {
  id: string;
  code: string;
  status: 'valid' | 'used' | 'transferred' | 'refunded' | 'cancelled';
  qr_data: string;
  profiles?: ApiProfile | null;
}

// ── Display shapes used in render ─────────────────────────────────────────

interface PostItem {
  i: string; // initials
  n: string; // display name
  role: 'crew' | 'member';
  t: string; // relative time
  b: string; // body text
}

interface SetTimeItem {
  t: string;
  name: string;
  status: 'past' | 'now' | 'next' | 'later';
}

// ── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return `${Math.floor(diffH / 24)}d`;
}

function initialsFrom(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Compute set status by comparing "HH:MM" string against current time.
 * - past:  set_time < now - 90 min
 * - now:   now is within 90 min after set_time
 * - next:  first slot that is still upcoming (only one slot gets this)
 * - later: all other future slots
 *
 * The function takes the full list and returns a mapped array so "next" can
 * only be assigned to the first qualifying entry.
 */
function computeSetStatuses(
  entries: Array<{ t: string; name: string }>,
  nowMs: number,
): SetTimeItem[] {
  const nowDate = new Date(nowMs);
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

  let nextAssigned = false;

  return entries.map(({ t, name }) => {
    if (t === 'TBA') {
      return { t, name, status: 'later' as const };
    }

    const [hhStr, mmStr] = t.split(':');
    const hh = Number(hhStr ?? 0);
    const mm = Number(mmStr ?? 0);
    const setMinutes = hh * 60 + mm;

    // Wrap around midnight: treat early-morning slots (0–5h) as post-midnight
    // by adding 24*60 if they come before a "normal" evening start (≥ 18h).
    // This keeps ordering correct for typical overnight events.
    const adjustedSet = setMinutes < 6 * 60 ? setMinutes + 24 * 60 : setMinutes;
    const adjustedNow = nowMinutes < 6 * 60 ? nowMinutes + 24 * 60 : nowMinutes;

    if (adjustedSet < adjustedNow - 90) {
      return { t, name, status: 'past' as const };
    }
    if (adjustedSet <= adjustedNow) {
      return { t, name, status: 'now' as const };
    }
    // Future slot
    if (!nextAssigned) {
      nextAssigned = true;
      return { t, name, status: 'next' as const };
    }
    return { t, name, status: 'later' as const };
  });
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ height = 48, width = '100%' }: { height?: number; width?: number | string }) {
  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: 8,
        height,
        width,
        animation: 'hof-shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export default function LiveNightScreen() {
  const router = useRouter();
  const [now, setNow] = useState(Date.now());
  const [mapOpen, setMapOpen] = useState(false);

  // Data state
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(false);

  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);
  const [setTimes, setSetTimes] = useState<SetTimeItem[]>([]);
  const [lineupLoading, setLineupLoading] = useState(true);

  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [ticketHolderName, setTicketHolderName] = useState<string | null>(null);
  const [ticketLoading, setTicketLoading] = useState(true);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch posts
  useEffect(() => {
    let cancelled = false;
    setPostsLoading(true);
    setPostsError(false);
    fetch('/api/posts?channel=general&limit=3')
      .then((r) => r.json() as Promise<{ posts?: ApiPost[] }>)
      .then(({ posts: raw }) => {
        if (cancelled || !raw) return;
        const mapped: PostItem[] = raw.slice(0, 3).map((p) => {
          const profile = p.is_anonymous ? null : p.profiles;
          const displayName = profile?.display_name ?? 'Anonymous';
          const role =
            profile?.role === 'crew' || profile?.role === 'admin'
              ? ('crew' as const)
              : ('member' as const);
          return {
            i: initialsFrom(displayName),
            n: displayName,
            role,
            t: relativeTime(p.created_at),
            b: p.body ?? p.title,
          };
        });
        setPosts(mapped);
      })
      .catch(() => {
        if (!cancelled) setPostsError(true);
      })
      .finally(() => {
        if (!cancelled) setPostsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch upcoming event → then fetch lineup
  useEffect(() => {
    let cancelled = false;
    setLineupLoading(true);

    fetch('/api/events/upcoming')
      .then((r) => r.json() as Promise<{ event?: ApiEvent }>)
      .then(({ event }) => {
        if (cancelled || !event) return;
        setEventId(event.id);
        setEventName(event.name);
        return fetch(`/api/events/${event.id}/lineup`)
          .then((r) => r.json() as Promise<{ lineup?: ApiLineupEntry[] }>)
          .then(({ lineup }) => {
            if (cancelled || !lineup) return;
            const rawEntries = lineup.map((entry) => ({
              t: entry.set_time ?? 'TBA',
              name: entry.artist.name,
            }));
            // Re-compute statuses relative to current time at load; the clock
            // update effect does not re-trigger lineup fetches (by design).
            setSetTimes(computeSetStatuses(rawEntries, Date.now()));
          });
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLineupLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Re-compute set statuses every minute as wall-clock advances.
  // Use the functional updater to avoid a stale-closure dependency on setTimes.
  useEffect(() => {
    setSetTimes((prev) => {
      if (prev.length === 0) return prev;
      const rawEntries = prev.map(({ t, name }) => ({ t, name }));
      return computeSetStatuses(rawEntries, now);
    });
  }, [now]);

  // Fetch tickets
  useEffect(() => {
    let cancelled = false;
    setTicketLoading(true);
    fetch('/api/tickets/mine')
      .then((r) => r.json() as Promise<{ tickets?: ApiTicket[] }>)
      .then(({ tickets }) => {
        if (cancelled) return;
        const valid = tickets?.find((tk) => tk.status === 'valid') ?? null;
        setTicketCode(valid?.code ?? null);
        setTicketHolderName(valid?.profiles?.display_name ?? null);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setTicketLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { isWide, isDesktop } = useResponsive();

  useAppHeader({ title: 'Live' });

  const hh = new Date(now).getHours();
  const mm = String(new Date(now).getMinutes()).padStart(2, '0');

  const venueInfo: Array<[string, IconName, string]> = [
    ['Bar / Water', 'pin', 'Free water · cash bar'],
    ['Coat check', 'wallet', '$3 cash · Venmo backup'],
    ['Restrooms', 'user', 'Back hallway · left'],
    ['Photographer', 'camera', 'Mauro · ask before pics'],
  ];

  if (!lineupLoading && !eventId) {
    return (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            background: colors.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <EmptyState
            icon="flame"
            title={NO_EVENTS_MESSAGE}
            action={
              <button
                className="hof-btn hof-press"
                onClick={() => router.push('/')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  background: colors.amber,
                  border: `1px solid ${colors.amber}`,
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: 14,
                  color: colors.bg,
                }}
              >
                Back to home
              </button>
            }
          />
        </div>
    );
  }

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
        {/* Live banner — amber top strip */}
        <div
          style={{
            position: 'absolute',
            top: isWide ? 12 : 8,
            left: isWide ? '50%' : 0,
            right: isWide ? 'auto' : 0,
            transform: isWide ? 'translateX(-50%)' : undefined,
            width: isWide
              ? isDesktop
                ? `min(100%, ${layoutWidth.appDesktop}px)`
                : `min(100%, ${layoutWidth.app}px)`
              : 'auto',
            boxSizing: 'border-box',
            zIndex: 10,
            padding: '10px 16px',
            background: colors.amber,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: colors.bg,
                animation: 'hof-pulse 1.4s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: 11,
                color: colors.bg,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              Doors are open
            </span>
          </div>
          <span
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              color: colors.bg,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
            }}
          >
            {hh}:{mm} MT
          </span>
        </div>

        {/* Inner scroll — centered column on tablet/desktop */}
        <div
          className="hof-scroll"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: isWide ? '50%' : 0,
            right: isWide ? 'auto' : 0,
            transform: isWide ? 'translateX(-50%)' : undefined,
            width: isWide
              ? isDesktop
                ? `min(100%, ${layoutWidth.appDesktop}px)`
                : `min(100%, ${layoutWidth.app}px)`
              : 'auto',
            overflowY: 'auto',
          }}
        >
          <div style={{ height: 92 }} />

          {/* QR ticket hero */}
          <div style={{ padding: '14px 16px 0' }}>
            {ticketLoading ? (
              <Skeleton height={280} />
            ) : ticketCode ? (
              <button
                className="hof-btn hof-press"
                onClick={() => router.push('/ticket')}
                style={{
                  width: '100%',
                  padding: 0,
                  textAlign: 'left',
                  background: colors.text,
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 12px 40px rgba(232,101,26,0.25), 0 0 0 1px rgba(240,237,230,0.1)',
                  display: 'block',
                }}
              >
                <div style={{ padding: '16px 18px 8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'Inter',
                        fontSize: 10,
                        color: colors.bg,
                        opacity: 0.55,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Your ticket · Th {eventId ? '' : '24'}
                    </div>
                    <span
                      style={{
                        padding: '3px 7px',
                        background: colors.amber,
                        color: colors.bg,
                        fontFamily: 'Inter',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        borderRadius: 3,
                      }}
                    >
                      GA
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    padding: '4px 16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <FakeQR size={220} fg={colors.bg} bg={colors.text} />
                  <div
                    style={{
                      marginTop: 12,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 13,
                      color: colors.bg,
                      letterSpacing: '0.16em',
                      fontWeight: 500,
                    }}
                  >
                    {ticketCode}
                    {ticketHolderName ? ` · ${ticketHolderName}` : ''}
                  </div>
                </div>
              </button>
            ) : (
              <div
                style={{
                  padding: '20px 18px',
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: 14,
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  No ticket yet
                </div>
                <button
                  className="hof-btn hof-press"
                  onClick={() => router.push('/checkout')}
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: colors.amber,
                    fontWeight: 600,
                  }}
                >
                  Get a ticket →
                </button>
              </div>
            )}
          </div>

          {/* Brightness hint */}
          <div
            style={{
              margin: '10px 16px 0',
              padding: '10px 14px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Icon name="bolt" size={14} color={colors.warning} />
            <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12, color: colors.textSec }}>
              Brightness will auto-max when you reach the scanner.
            </div>
          </div>

          {/* Live thread strip — COMMUNITY_FEATURE */}
          {COMMUNITY_FEATURE_ENABLED ? (
          <div style={{ padding: '24px 16px 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: colors.amber,
                      color: colors.bg,
                      fontFamily: 'Inter',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        background: colors.bg,
                        animation: 'hof-pulse 1.4s ease-in-out infinite',
                      }}
                    />
                    Live
                  </span>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 10,
                      color: colors.textSec,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Tonight&apos;s thread
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'Clash Display',
                    fontWeight: 600,
                    fontSize: 20,
                    color: colors.text,
                    marginTop: 6,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {eventName ? `${eventName} · open mic` : "Tonight's thread"}
                </div>
              </div>
              <button
                className="hof-btn"
                onClick={() => router.push('/community')}
                style={{ fontFamily: 'Inter', fontSize: 12, color: colors.amber, fontWeight: 500 }}
              >
                Open →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {postsLoading ? (
                <>
                  <FeedSkeletonCard />
                  <FeedSkeletonCard />
                </>
              ) : postsError ? (
                <ErrorState
                  retry={() => {
                    setPostsLoading(true);
                    setPostsError(false);
                    fetch('/api/posts?channel=general&limit=3')
                      .then((r) => r.json() as Promise<{ posts?: ApiPost[] }>)
                      .then(({ posts: raw }) => {
                        if (!raw) return;
                        const mapped: PostItem[] = raw.slice(0, 3).map((p) => {
                          const profile = p.is_anonymous ? null : p.profiles;
                          const displayName = profile?.display_name ?? 'Anonymous';
                          const role =
                            profile?.role === 'crew' || profile?.role === 'admin'
                              ? ('crew' as const)
                              : ('member' as const);
                          return {
                            i: initialsFrom(displayName),
                            n: displayName,
                            role,
                            t: relativeTime(p.created_at),
                            b: p.body ?? p.title,
                          };
                        });
                        setPosts(mapped);
                      })
                      .catch(() => setPostsError(true))
                      .finally(() => setPostsLoading(false));
                  }}
                />
              ) : posts.length > 0 ? (
                posts.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      padding: '10px 12px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 10,
                    }}
                  >
                    <Avatar initials={p.i} userRole={p.role} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}
                      >
                        <span
                          style={{
                            fontFamily: 'Inter',
                            fontWeight: 500,
                            fontSize: 12,
                            color: colors.text,
                          }}
                        >
                          {p.n}
                        </span>
                        {p.role === 'crew' && (
                          <HofPill tone="crew" size="sm">
                            Crew
                          </HofPill>
                        )}
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono',
                            fontSize: 10,
                            color: colors.textSec,
                          }}
                        >
                          · {p.t}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 13,
                          color: colors.text,
                          lineHeight: 1.4,
                        }}
                      >
                        {p.b}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '14px 12px',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: colors.textSec,
                  }}
                >
                  Nothing yet — be the first to post.
                </div>
              )}
            </div>
          </div>
          ) : null}

          {/* Set times */}
          <div style={{ padding: '24px 16px 0' }}>
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
              Now playing · Set times
            </div>
            <div
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {lineupLoading ? (
                <div
                  style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <Skeleton height={44} />
                  <Skeleton height={44} />
                  <Skeleton height={44} />
                </div>
              ) : setTimes.length > 0 ? (
                setTimes.map((l, i, a) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 14px',
                      borderBottom: i < a.length - 1 ? `1px solid ${colors.border}` : 'none',
                      opacity: l.status === 'past' ? 0.4 : 1,
                      background: l.status === 'now' ? 'rgba(232,101,26,0.06)' : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: 12,
                        color: l.status === 'now' ? colors.amber : colors.textSec,
                        width: 44,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {l.t}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'Clash Display',
                          fontWeight: 600,
                          fontSize: 16,
                          color: l.status === 'now' ? colors.amber : colors.text,
                        }}
                      >
                        {l.name}
                      </div>
                    </div>
                    {l.status === 'now' && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontFamily: 'Inter',
                          fontSize: 10,
                          color: colors.amber,
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 3,
                            background: colors.amber,
                            animation: 'hof-pulse 1.4s ease-in-out infinite',
                          }}
                        />
                        Now
                      </span>
                    )}
                    {l.status === 'next' && (
                      <span
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 10,
                          color: colors.textSec,
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Up next
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '14px',
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: colors.textSec,
                  }}
                >
                  Lineup not announced yet.
                </div>
              )}
            </div>
          </div>

          {/* At the venue */}
          <div style={{ padding: '24px 16px 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: 10,
                  color: colors.amber,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                }}
              >
                At the venue
              </div>
              <button
                className="hof-btn"
                onClick={() => setMapOpen(true)}
                style={{
                  fontFamily: 'Inter',
                  fontSize: 12,
                  color: colors.amber,
                  fontWeight: 500,
                }}
              >
                View on map →
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {venueInfo.map(([t, ic, sub]) => (
                <div
                  key={t}
                  style={{
                    padding: '12px 14px',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                  }}
                >
                  <Icon name={ic} size={16} color={colors.amber} />
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontSize: 13,
                      color: colors.text,
                      marginTop: 8,
                    }}
                  >
                    {t}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 11,
                      color: colors.textSec,
                      marginTop: 2,
                      lineHeight: 1.4,
                    }}
                  >
                    {sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency strip */}
          <div style={{ padding: '24px 16px 0' }}>
            <button
              className="hof-btn hof-press"
              style={{
                width: '100%',
                padding: '12px 14px',
                textAlign: 'left',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: 'rgba(232,74,26,0.12)',
                  border: '1px solid rgba(232,74,26,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="bolt" size={14} color={colors.error} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: colors.text }}
                >
                  Reach Crew or report something
                </div>
                <div
                  style={{ fontFamily: 'Inter', fontSize: 11, color: colors.textSec, marginTop: 1 }}
                >
                  Crew is in the room. Discreet help button.
                </div>
              </div>
              <Icon name="chev" size={14} color={colors.textSec} />
            </button>
          </div>

          {/* Bottom spacer for nav */}
          <div style={{ height: 120 }} />
        </div>

        <MapSheet open={mapOpen} onClose={() => setMapOpen(false)} />
      </div>
  );
}
