'use client';

import { colors, layoutChrome, layoutWidth } from '@hof/design-tokens';
import type { Post as UiPost } from '@hof/ui';
import { EmptyState, ErrorState, FeedPost, FeedSkeletonCard, Icon, useResponsive } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react';
import { AppHeaderIconButton } from '@/components/AppHeaderIconButton';
import { EventHeroBackground } from '@/components/EventHeroBackground';
import { useAppHeader } from '@/hooks/useAppHeader';
import { useCommunityRealtime } from '@/hooks/useCommunityRealtime';
import { INVENTORY_POLL_MS, useEventInventory } from '@/hooks/useEventInventory';
import { COMMUNITY_FEATURE_ENABLED } from '@/lib/features';
import {
  formatCapacityMeta,
  formatDoorsRange,
  formatEventDateLong,
  eventHeroBadgeColors,
  eventHeroBadgeLabel,
  eventHeroBadgeTone,
  isEventSoldOut,
  NO_EVENTS_MESSAGE,
  parseEventFaqs,
  resolveEventHeroImage,
  totalTicketsSold,
  type UpcomingEvent,
} from '@/lib/eventDisplay';
import { photoSrc } from '../data/photos';
import { apiPostToUi, type ApiPost } from '../lib/postUi';
import CalendarSheet from '../sheets/CalendarSheet';
import { MapSheet } from '../sheets/MapSheet';
import { ShareSheet } from '../sheets/ShareSheet';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '28px 0 14px' }}>
      <div
        style={{
          fontFamily: 'Inter',
          fontSize: 10,
          color: colors.amber,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: colors.elevated,
          border: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={16} color={colors.amber} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 10,
            color: colors.amber,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 13,
            color: colors.text,
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

interface Tier {
  id: string;
  name: string;
  price: number;
  sub: string;
  remaining: number;
  tone: 'soldout' | 'normal' | 'gold';
}

function TierCard({
  tier,
  selected,
  onSelect,
}: {
  tier: Tier;
  selected: boolean;
  onSelect: () => void;
}) {
  const isVip = tier.tone === 'gold';
  const isSold = tier.remaining === 0;
  return (
    <button
      className="hof-btn hof-press"
      onClick={onSelect}
      style={{
        textAlign: 'left',
        position: 'relative',
        padding: 16,
        background: selected ? colors.elevated : colors.surface,
        border: selected
          ? `2px solid ${isVip ? colors.gold : colors.amber}`
          : `1px solid ${isVip ? 'rgba(201,148,42,0.4)' : colors.border}`,
        borderRadius: 12,
        opacity: isSold ? 0.5 : 1,
        cursor: isSold ? 'not-allowed' : 'pointer',
      }}
    >
      {isVip && (
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 20,
              background: 'rgba(201,148,42,0.15)',
              border: `1px solid ${colors.gold}30`,
              fontFamily: 'Inter',
              fontSize: 11,
              fontWeight: 600,
              color: colors.gold,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            VIP
          </span>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingRight: isVip ? 52 : 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'Clash Display',
              fontWeight: 600,
              fontSize: 18,
              color: isVip ? colors.gold : colors.text,
              letterSpacing: '0.01em',
            }}
          >
            {tier.name}
          </div>
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              color: colors.textSec,
              marginTop: 2,
            }}
          >
            {tier.sub}
          </div>
        </div>
        <div
          style={{
            fontFamily: 'Clash Display',
            fontWeight: 600,
            fontSize: 22,
            color: colors.text,
            letterSpacing: '-0.01em',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          ${tier.price}
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {isSold ? (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 20,
              background: 'rgba(232,74,26,0.15)',
              border: `1px solid ${colors.error}30`,
              fontFamily: 'Inter',
              fontSize: 11,
              fontWeight: 600,
              color: colors.error,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Sold out
          </span>
        ) : tier.remaining < 20 ? (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 20,
              background: 'rgba(232,162,26,0.15)',
              border: `1px solid ${colors.warning}30`,
              fontFamily: 'Inter',
              fontSize: 11,
              fontWeight: 600,
              color: colors.warning,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Only {tier.remaining} left
          </span>
        ) : (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 20,
              background: 'rgba(76,175,110,0.15)',
              border: `1px solid ${colors.success}30`,
              fontFamily: 'Inter',
              fontSize: 11,
              fontWeight: 600,
              color: colors.success,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Available
          </span>
        )}
        {selected && !isSold && (
          <span
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              color: colors.amber,
              fontWeight: 500,
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Icon name="check" size={14} color={colors.amber} /> Selected
          </span>
        )}
      </div>
    </button>
  );
}

type LineupEntry = {
  artist: {
    id: string;
    name: string;
    slug: string;
    photo_url: string | null;
    instagram: string | null;
  };
  set_time: string | null;
  role: string;
  sort_order: number;
};

export default function EventScreen({ onOpenArtist }: { onOpenArtist?: (slug: string) => void }) {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [openFaq, setOpenFaq] = useState(0);
  const [calOpen, setCalOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [eventPosts, setEventPosts] = useState<UiPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(false);
  const [apiLineup, setApiLineup] = useState<LineupEntry[]>([]);
  const [wlName, setWlName] = useState('');
  const [wlEmail, setWlEmail] = useState('');
  const [wlSubmitting, setWlSubmitting] = useState(false);
  const [wlDone, setWlDone] = useState<{ position: number } | null>(null);
  const [eventData, setEventData] = useState<UpcomingEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events/upcoming')
      .then((r) => r.json())
      .then((d) => {
        if (d.event) setEventData(d.event);
      })
      .catch(console.error)
      .finally(() => setEventLoading(false));
  }, []);

  useEventInventory({
    event: eventData,
    onEventChange: setEventData,
    enabled: !eventLoading,
    pollIntervalMs: INVENTORY_POLL_MS.event,
  });

  const loadEventPosts = useCallback(() => {
    if (!eventData?.id) return;
    setPostsLoading(true);
    setPostsError(false);
    fetch(`/api/posts?eventId=${eventData.id}&limit=3`)
      .then((r) => r.json())
      .then((d: { posts?: ApiPost[] }) => {
        if (d.posts) setEventPosts(d.posts.map((p) => apiPostToUi(p)));
        else setEventPosts([]);
      })
      .catch(() => setPostsError(true))
      .finally(() => setPostsLoading(false));
  }, [eventData?.id]);

  const patchEventPost = useCallback(
    (row: { id: string; reaction_counts?: Record<string, number>; reply_count?: number }) => {
      setEventPosts((prev) =>
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
    eventId: eventData?.id,
    onPostInsert: async (row) => {
      try {
        const r = await fetch(`/api/posts/${row.id}`);
        if (!r.ok) return;
        const d = (await r.json()) as { post?: ApiPost };
        if (!d.post) return;
        setEventPosts((prev) => {
          const next = [apiPostToUi(d.post!), ...prev.filter((p) => p.id !== d.post!.id)];
          return next.slice(0, 3);
        });
      } catch {
        /* keep list */
      }
    },
    onPostUpdate: (row) => patchEventPost(row),
    onPostDelete: (oldRow) => {
      if (oldRow.id) setEventPosts((prev) => prev.filter((p) => p.id !== oldRow.id));
    },
    onResync: () => loadEventPosts(),
    enabled: COMMUNITY_FEATURE_ENABLED && !!eventData?.id,
  });

  useEffect(() => {
    loadEventPosts();
  }, [loadEventPosts]);

  useEffect(() => {
    if (!eventData?.id) return;
    fetch(`/api/events/${eventData.id}/lineup`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { lineup?: LineupEntry[] } | null) => {
        if (d?.lineup && d.lineup.length > 0) setApiLineup(d.lineup);
      })
      .catch(() => {});
  }, [eventData?.id]);

  const rawTiers = eventData?.ticket_tiers ?? [];

  const soldOut = isEventSoldOut(rawTiers);
  const heroBadgeTone = eventHeroBadgeTone(eventData ?? { status: 'upcoming' }, rawTiers);
  const heroBadgeColors = eventHeroBadgeColors(heroBadgeTone);

  const tiers: Tier[] = rawTiers
    .filter((t) => t.status !== 'hidden')
    .map((t) => {
      const effective = (t as { effective_status?: string }).effective_status ?? t.status;
      const remaining =
        effective === 'sold_out' ? 0 : (t.remaining ?? Math.max(0, t.capacity - (t.sold ?? 0)));
      const feeCents = (t as { fee_cents?: number }).fee_cents ?? 0;
      const allInCents = t.price_cents + feeCents;
      return {
        id: t.id,
        name: t.display_name ?? t.name,
        price: allInCents / 100,
        sub: (t as { description?: string | null }).description?.trim() || 'Inclusive of fees',
        remaining,
        tone: (effective === 'sold_out' || remaining <= 0
          ? 'soldout'
          : t.name === 'vip'
            ? 'gold'
            : 'normal') as Tier['tone'],
      };
    });

  useEffect(() => {
    if (tiers.length > 0 && selectedTier === '') {
      const first = tiers.find((t) => t.remaining > 0);
      if (first) setSelectedTier(first.id);
    }
  }, [tiers, selectedTier]);

  const lineup = [
    { t: '9:00', name: 'IGNYTE', note: 'Opening · Boulder' },
    { t: '10:30', name: 'M3DIUM', note: 'House' },
    { t: '12:00', name: 'TBA', note: 'Headliner — announced 6/20' },
    { t: '1:00', name: 'After', note: 'DJ residents close' },
  ];

  const dressCodeText = eventData?.dress_code?.trim() || '';
  const apiFaqs = parseEventFaqs(eventData?.faqs).filter(
    (f) => !dressCodeText || !/^dress code/i.test(f.q.trim()),
  );
  const faqs =
    apiFaqs.length > 0
      ? apiFaqs
      : [
          {
            q: 'Where do I get in?',
            a: 'The side entrance on 23rd Street. Look for the orange light. We do not use the main door.',
          },
          ...(dressCodeText
            ? []
            : [
                {
                  q: 'Dress code?',
                  a: 'No code. People show up looking like themselves. Wear what makes you move.',
                },
              ]),
          {
            q: 'Is there a coat check?',
            a: 'Yes — $3. Cash or in-app. The line moves fastest before 10:30.',
          },
          {
            q: "Can I bring a friend who didn't buy a ticket?",
            a: 'Only if they bought a ticket. We do not sell at the door. We sell out every month.',
          },
        ];

  const ticketsSold = totalTicketsSold(eventData?.ticket_tiers);
  const eventCapacity = eventData?.capacity ?? 300;

  const { isWide, isDesktop } = useResponsive();

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
        <AppHeaderIconButton icon="share" label="Share event" onClick={() => setShareOpen(true)} />
      </>
    ),
    [],
  );

  const handleBack = useCallback(() => router.back(), [router]);

  useAppHeader({ title: 'Event', actions: headerActions, onBack: handleBack });

  const heroSrc = resolveEventHeroImage(eventData?.hero_image_url);

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

  if (!eventLoading && !eventData) {
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
          icon="calendar"
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
          <div style={pageColumn}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                background: heroBadgeColors.background,
                border: `1px solid ${heroBadgeColors.border}`,
                fontFamily: 'Inter',
                fontSize: 11,
                fontWeight: 600,
                color: heroBadgeColors.color,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {eventHeroBadgeLabel(
                eventData ?? { edition_number: 0, status: 'upcoming' },
                rawTiers,
              )}
            </span>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 700,
                fontSize: 38,
                lineHeight: 1,
                color: colors.text,
                marginTop: 10,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
              }}
            >
              {eventData?.name ?? 'Next theme'}
              {eventData?.tagline ? (
                <>
                  <br />
                  <span style={{ color: colors.amber }}>{eventData.tagline}</span>
                </>
              ) : null}
            </div>
          </div>
        </EventHeroBackground>

        <div style={pageColumn}>
          {/* Meta */}
          <div
            style={{
              padding: '20px 0',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: 20,
              rowGap: 16,
            }}
          >
            <MetaItem
              icon="calendar"
              label="Date"
              value={eventData?.date ? formatEventDateLong(eventData.date) : '—'}
            />
            <MetaItem
              icon="clock"
              label="Doors"
              value={formatDoorsRange(eventData?.doors_open, eventData?.doors_close)}
            />
            <MetaItem icon="pin" label="Venue" value={eventData?.venue_name ?? '—'} />
            <MetaItem
              icon="users"
              label="Capacity"
              value={formatCapacityMeta(eventCapacity, ticketsSold)}
            />
            {dressCodeText ? (
              <div style={{ gridColumn: '1 / -1' }}>
                <MetaItem icon="star" label="Dress code" value={dressCodeText} />
              </div>
            ) : null}
          </div>

          {/* Add to Calendar */}
          <div style={{ paddingBottom: 12 }}>
            <button
              className="hof-btn hof-press"
              onClick={() => setCalOpen(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: 'rgba(232,101,26,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="calendar" size={18} color={colors.amber} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontSize: 14,
                      color: colors.text,
                    }}
                  >
                    Add to Calendar
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: colors.textSec,
                      marginTop: 1,
                    }}
                  >
                    Apple · Google · Outlook · .ics
                  </div>
                </div>
              </div>
              <Icon name="chev" size={16} color={colors.textSec} />
            </button>
          </div>

          {/* Ticket tiers */}
          <SectionLabel>Tickets</SectionLabel>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {tiers.map((t) => (
              <TierCard
                key={t.id}
                tier={t}
                selected={selectedTier === t.id}
                onSelect={() => t.remaining > 0 && setSelectedTier(t.id)}
              />
            ))}
          </div>
          <div style={{ paddingTop: 16 }}>
            <button
              className="hof-btn hof-press"
              onClick={() => {
                if (!selectedTier) return;
                const tier = tiers.find((t) => t.id === selectedTier);
                if (!tier || tier.remaining === 0) return;
                router.push(`/checkout?tierId=${encodeURIComponent(selectedTier)}`);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '15px',
                background: soldOut ? colors.surface : colors.amber,
                border: `1px solid ${soldOut ? colors.border : colors.amber}`,
                borderRadius: 12,
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: 16,
                color: soldOut ? colors.textDis : colors.bg,
                cursor: soldOut ? 'not-allowed' : 'pointer',
                opacity: soldOut ? 0.5 : 1,
              }}
            >
              <Icon name="arrowR" size={18} color={soldOut ? colors.textDis : colors.bg} />
              Continue to checkout
            </button>
          </div>

          {/* Waitlist card — shown when all tiers are sold out */}
          {soldOut && (
            <div style={{ paddingTop: 16 }}>
              <div
                style={{
                  background: '#141412',
                  border: '1px solid #2A2826',
                  borderRadius: 12,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    fontFamily: 'Clash Display',
                    fontWeight: 600,
                    fontSize: 18,
                    color: '#F0EDE6',
                    letterSpacing: '-0.01em',
                    marginBottom: 4,
                  }}
                >
                  Sold out — join the waitlist
                </div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: '#8A8880',
                    marginBottom: 14,
                    lineHeight: 1.5,
                  }}
                >
                  We&apos;ll email you the moment a spot opens up.
                </div>

                {wlDone ? (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(232,101,26,0.12)',
                      border: '1px solid rgba(232,101,26,0.3)',
                      borderRadius: 8,
                      fontFamily: 'Inter',
                      fontSize: 14,
                      color: '#E8651A',
                      fontWeight: 500,
                      textAlign: 'center',
                    }}
                  >
                    You&apos;re #{wlDone.position} in line. We&apos;ll be in touch.
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={wlName}
                      onChange={(e) => setWlName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        background: '#0A0A08',
                        border: '1px solid #2A2826',
                        borderRadius: 8,
                        fontFamily: 'Inter',
                        fontSize: 14,
                        color: '#F0EDE6',
                        marginBottom: 8,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={wlEmail}
                      onChange={(e) => setWlEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        background: '#0A0A08',
                        border: '1px solid #2A2826',
                        borderRadius: 8,
                        fontFamily: 'Inter',
                        fontSize: 14,
                        color: '#F0EDE6',
                        marginBottom: 12,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      className="hof-btn hof-press"
                      disabled={wlSubmitting || !wlName.trim() || !wlEmail.trim()}
                      onClick={async () => {
                        if (!eventData?.id) return;
                        setWlSubmitting(true);
                        try {
                          const res = await fetch(`/api/events/${eventData.id}/waitlist`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: wlName, email: wlEmail }),
                          });
                          if (res.ok) {
                            const data = (await res.json()) as { position?: number };
                            setWlDone({ position: data.position ?? 1 });
                          }
                        } catch (_e) {
                          // silently fail — user can retry
                        } finally {
                          setWlSubmitting(false);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '13px',
                        background: '#E8651A',
                        border: '1px solid #E8651A',
                        borderRadius: 8,
                        fontFamily: 'Inter',
                        fontWeight: 600,
                        fontSize: 15,
                        color: '#0A0A08',
                        cursor: wlSubmitting ? 'wait' : 'pointer',
                        opacity: wlSubmitting || !wlName.trim() || !wlEmail.trim() ? 0.6 : 1,
                      }}
                    >
                      {wlSubmitting ? 'Joining…' : 'Join Waitlist'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* What to expect */}
          <SectionLabel>What to expect</SectionLabel>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {(
              [
                ['House and techno', 'Five hours, four artists, one room.'],
                ['No phones on the floor', 'Photos by the in-house photographer only.'],
                ['Water is free', 'Hydrate. Pace yourself. We close at one.'],
              ] as [string, string][]
            ).map(([t, s]) => (
              <div
                key={t}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '12px 0',
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'rgba(232,101,26,0.12)',
                    color: colors.amber,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="check" size={16} color={colors.amber} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontSize: 14,
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

          {/* Lineup */}
          <SectionLabel>Lineup</SectionLabel>
          <div>
            {apiLineup.length > 0
              ? apiLineup.map((entry, i) => (
                  <div
                    key={entry.artist.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 0',
                      borderBottom:
                        i < apiLineup.length - 1 ? `1px solid ${colors.border}` : 'none',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: 13,
                        color: colors.textSec,
                        width: 50,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {entry.set_time ?? '—'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <button
                        className="hof-btn"
                        onClick={() => onOpenArtist?.(entry.artist.slug)}
                        style={{
                          textAlign: 'left',
                          padding: 0,
                          background: 'transparent',
                          display: 'block',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'Clash Display',
                            fontWeight: 600,
                            fontSize: 18,
                            color: colors.text,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {entry.artist.name}
                        </div>
                      </button>
                      <div
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 12,
                          color: colors.textSec,
                          marginTop: 2,
                          textTransform: 'capitalize',
                        }}
                      >
                        {entry.role}
                      </div>
                    </div>
                  </div>
                ))
              : lineup.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 0',
                      borderBottom: i < lineup.length - 1 ? `1px solid ${colors.border}` : 'none',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: 13,
                        color: colors.textSec,
                        width: 50,
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
                          fontSize: 18,
                          color: colors.text,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {l.name}
                      </div>
                      <div
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 12,
                          color: colors.textSec,
                          marginTop: 2,
                        }}
                      >
                        {l.note}
                      </div>
                    </div>
                    {l.name === 'TBA' && (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 20,
                          background: 'rgba(42,40,38,0.8)',
                          border: `1px solid ${colors.textSec}30`,
                          fontFamily: 'Inter',
                          fontSize: 11,
                          fontWeight: 600,
                          color: colors.textSec,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Announced 6/20
                      </span>
                    )}
                  </div>
                ))}
          </div>

          {/* Venue */}
          <SectionLabel>Venue</SectionLabel>
          <div>
            <div
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: 140,
                  position: 'relative',
                  background: colors.elevated,
                }}
              >
                <svg
                  width="100%"
                  height="140"
                  viewBox="0 0 320 140"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <rect width="320" height="140" fill="#15130f" />
                  {[20, 60, 100, 140, 180, 220, 260, 300].map((x) => (
                    <line
                      key={x}
                      x1={x}
                      y1="0"
                      x2={x}
                      y2="140"
                      stroke="#22201c"
                      strokeWidth="0.5"
                    />
                  ))}
                  {[20, 50, 80, 110].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="320"
                      y2={y}
                      stroke="#22201c"
                      strokeWidth="0.5"
                    />
                  ))}
                  <path d="M0 80 L320 70" stroke="#2A2826" strokeWidth="3" />
                  <path d="M80 0 L100 140" stroke="#2A2826" strokeWidth="2" />
                  <path d="M200 0 L210 140" stroke="#2A2826" strokeWidth="2" />
                  <rect
                    x="120"
                    y="40"
                    width="60"
                    height="50"
                    fill="#1f1d1a"
                    stroke={colors.amber}
                    strokeWidth="1.5"
                  />
                  <circle cx="150" cy="65" r="18" fill={colors.amber} opacity="0.2" />
                  <circle cx="150" cy="65" r="6" fill={colors.amber} />
                </svg>
              </div>
              <div style={{ padding: 14 }}>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: 15,
                    color: colors.text,
                  }}
                >
                  {eventData?.venue_name ?? 'Venue'}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: colors.textSec,
                    marginTop: 2,
                  }}
                >
                  {eventData?.venue_address ?? '—'}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {(['Directions', 'Parking info'] as const).map((label) => (
                    <button
                      key={label}
                      className="hof-btn hof-press"
                      onClick={() => setMapOpen(true)}
                      style={{
                        padding: '8px 14px',
                        background: 'transparent',
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        fontFamily: 'Inter',
                        fontSize: 13,
                        color: colors.text,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Talking about this — COMMUNITY_FEATURE */}
          {COMMUNITY_FEATURE_ENABLED ? (
            <>
              <SectionLabel>Talking about this</SectionLabel>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {postsLoading && (
                  <>
                    <FeedSkeletonCard />
                    <FeedSkeletonCard />
                  </>
                )}
                {!postsLoading && postsError && (
                  <ErrorState
                    retry={() => {
                      if (!eventData?.id) return;
                      setPostsLoading(true);
                      setPostsError(false);
                      fetch(`/api/posts?eventId=${eventData.id}&limit=3`)
                        .then((r) => r.json())
                        .then((d: { posts?: ApiPost[] }) => {
                          if (d.posts) setEventPosts(d.posts.map((p) => apiPostToUi(p)));
                          else setEventPosts([]);
                        })
                        .catch(() => setPostsError(true))
                        .finally(() => setPostsLoading(false));
                    }}
                  />
                )}
                {!postsLoading &&
                  !postsError &&
                  eventPosts.map((p) => (
                    <FeedPost
                      key={p.id}
                      post={p}
                      compact
                      onOpen={() => router.push('/community/' + p.id)}
                      resolvePhoto={photoSrc}
                    />
                  ))}
                <button
                  className="hof-btn hof-press"
                  onClick={() => router.push('/community')}
                  style={{
                    padding: '12px 14px',
                    background: colors.surface,
                    border: `1px dashed ${colors.border}`,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: colors.text,
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <Icon name="chat" size={16} color={colors.amber} />
                    Open the Theme 24 thread
                  </span>
                  <Icon name="chev" size={14} color={colors.textSec} />
                </button>
              </div>
            </>
          ) : null}

          {/* FAQ */}
          <SectionLabel>FAQ</SectionLabel>
          <div>
            {faqs.map((f, i) => (
              <button
                key={i}
                className="hof-btn"
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 0',
                  borderBottom: i < faqs.length - 1 ? `1px solid ${colors.border}` : 'none',
                }}
              >
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
                      fontWeight: 500,
                      fontSize: 14,
                      color: colors.text,
                    }}
                  >
                    {f.q}
                  </div>
                  <Icon
                    name="chevDn"
                    size={16}
                    color={colors.textSec}
                    style={{
                      transform: openFaq === i ? 'rotate(180deg)' : 'none',
                      transition: 'transform 150ms',
                    }}
                  />
                </div>
                {openFaq === i && (
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 13,
                      color: colors.textSec,
                      lineHeight: 1.6,
                      marginTop: 8,
                    }}
                  >
                    {f.a}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Past edition footer */}
          <div style={{ paddingTop: 28 }}>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 11,
                color: colors.textSec,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Previously
            </div>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 20,
                color: colors.text,
                letterSpacing: '-0.01em',
              }}
            >
              23 sold-out themes. Browse the archive →
            </div>
          </div>

          <div style={{ height: 24 }} />
        </div>
      </div>

      <CalendarSheet
        open={calOpen}
        onClose={() => setCalOpen(false)}
        event={eventData ?? undefined}
      />
      <MapSheet open={mapOpen} onClose={() => setMapOpen(false)} />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
