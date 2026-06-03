'use client';

import { colors, layoutWidth } from '@hof/design-tokens';
import type { NavId, Post as UiPost } from '@hof/ui';
import { FeedPost, HofAppShell, Icon, useResponsive } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { photoSrc } from '../data/photos';
import { navHref } from '../lib/nav';
import CalendarSheet from '../sheets/CalendarSheet';

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

import { MapSheet } from '../sheets/MapSheet';
import { ShareSheet } from '../sheets/ShareSheet';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '28px 16px 14px' }}>
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
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
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
      <div>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 10,
            color: colors.textSec,
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
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div>
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
            marginRight: isVip ? 60 : 0,
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
  const [apiLineup, setApiLineup] = useState<LineupEntry[]>([]);
  const [wlName, setWlName] = useState('');
  const [wlEmail, setWlEmail] = useState('');
  const [wlSubmitting, setWlSubmitting] = useState(false);
  const [wlDone, setWlDone] = useState<{ position: number } | null>(null);
  const [eventData, setEventData] = useState<null | {
    id: string;
    edition_number: number;
    name: string;
    ticket_tiers: Array<{
      id: string;
      name: string;
      display_name: string;
      price_cents: number;
      capacity: number;
      status: 'available' | 'sold_out' | 'hidden';
      sort_order: number;
      description: string | null;
    }>;
  }>(null);

  useEffect(() => {
    fetch('/api/events/upcoming')
      .then((r) => r.json())
      .then((d) => {
        if (d.event) setEventData(d.event);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!eventData?.id) return;
    fetch(`/api/posts?eventId=${eventData.id}&limit=3`)
      .then((r) => r.json())
      .then((d: { posts?: ApiPost[] }) => {
        if (d.posts) setEventPosts(d.posts.map(apiPostToUi));
      })
      .catch(console.error);
  }, [eventData?.id]);

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

  const soldOut =
    rawTiers.length > 0 &&
    rawTiers.every((t) => t.status === 'sold_out' || (t.capacity > 0 && t.capacity <= 0));

  const tiers: Tier[] =
    rawTiers.length > 0
      ? rawTiers.map((t) => ({
          id: t.id,
          name: t.display_name,
          price: t.price_cents / 100,
          sub: t.description ?? '',
          remaining: t.status === 'sold_out' ? 0 : Math.max(0, t.capacity - 0),
          tone: (t.status === 'sold_out'
            ? 'soldout'
            : t.name === 'vip'
              ? 'gold'
              : 'normal') as Tier['tone'],
        }))
      : [
          {
            id: 'early',
            name: 'Early Bird',
            price: 20,
            sub: 'Doors 8 — 10 PM',
            remaining: 0,
            tone: 'soldout' as const,
          },
          {
            id: 'ga',
            name: 'General',
            price: 28,
            sub: 'Doors all night',
            remaining: 47,
            tone: 'normal' as const,
          },
          {
            id: 'vip',
            name: 'VIP',
            price: 55,
            sub: 'Private room · 1 drink',
            remaining: 12,
            tone: 'gold' as const,
          },
        ];

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

  const faqs = [
    {
      q: 'Where do I get in?',
      a: 'The side entrance on 23rd Street. Look for the orange light. We do not use the main door.',
    },
    {
      q: 'Dress code?',
      a: 'No code. People show up looking like themselves. Wear what makes you move.',
    },
    {
      q: 'Is there a coat check?',
      a: 'Yes — $3. Cash or in-app. The line moves fastest before 10:30.',
    },
    {
      q: "Can I bring a friend who didn't buy a ticket?",
      a: 'Only if they bought a ticket. We do not sell at the door. We sell out every month.',
    },
  ];

  const { isWide, isDesktop } = useResponsive();

  return (
    <HofAppShell active="events" onNav={(id: NavId) => router.push(navHref[id])}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: colors.bg,
          overflow: 'hidden',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            position: 'absolute',
            top: isWide ? 12 : 54,
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(10,10,8,0.7)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <button
            className="hof-btn hof-press"
            onClick={() => router.back()}
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
            }}
          >
            <Icon
              name="chev"
              size={18}
              color={colors.text}
              style={{ transform: 'rotate(180deg)' }}
            />
          </button>
          <span
            style={{
              fontFamily: 'Inter',
              fontWeight: 500,
              fontSize: 16,
              color: colors.text,
            }}
          >
            Event
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
              onClick={() => setShareOpen(true)}
              aria-label="Share event"
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
              }}
            >
              <Icon name="share" size={20} color={colors.text} />
            </button>
          </div>
        </div>

        {/* Scrollable content — centered column on tablet/desktop */}
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
            paddingBottom: isWide ? 40 : 80,
          }}
        >
          {/* Hero */}
          <div style={{ position: 'relative', height: 360, overflow: 'hidden' }}>
            <img
              src={photoSrc(1)}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 40%',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 240,
                background: 'linear-gradient(180deg, transparent, rgba(10,10,8,0.85) 60%, #0A0A08)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: 18,
              }}
            >
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(232,101,26,0.15)',
                  border: `1px solid ${colors.amber}30`,
                  fontFamily: 'Inter',
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.amber,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Upcoming · Edition № 24
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
                Fireversary
                <br />
                <span style={{ color: colors.amber }}>2-Year Anniversary</span>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div
            style={{
              padding: '20px 16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <MetaItem icon="calendar" label="Date" value="Fri, June 26 · 2026" />
            <MetaItem icon="clock" label="Doors" value="8 PM — 1 AM" />
            <MetaItem icon="pin" label="Venue" value="Junkyard Social Club" />
            <MetaItem icon="users" label="Capacity" value="300 · sold out 23/24" />
          </div>

          {/* Add to Calendar */}
          <div style={{ padding: '0 16px 4px' }}>
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
              padding: '0 16px',
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
          <div style={{ padding: '16px 16px 0' }}>
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
            <div style={{ padding: '16px 16px 0' }}>
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
              padding: '0 16px',
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
          <div style={{ padding: '0 16px' }}>
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
          <div style={{ padding: '0 16px' }}>
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
                  Junkyard Social Club
                </div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: colors.textSec,
                    marginTop: 2,
                  }}
                >
                  2525 Pearl St, Boulder, CO 80302
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

          {/* Talking about this */}
          <SectionLabel>Talking about this</SectionLabel>
          <div
            style={{
              padding: '0 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {eventPosts.map((p) => (
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
                Open the Edition 24 thread
              </span>
              <Icon name="chev" size={14} color={colors.textSec} />
            </button>
          </div>

          {/* FAQ */}
          <SectionLabel>FAQ</SectionLabel>
          <div style={{ padding: '0 16px' }}>
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
          <div style={{ padding: '28px 16px 0' }}>
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
              23 sold-out editions. Browse the archive →
            </div>
          </div>

          <div style={{ height: 24 }} />
        </div>

        <CalendarSheet open={calOpen} onClose={() => setCalOpen(false)} />
        <MapSheet open={mapOpen} onClose={() => setMapOpen(false)} />
        <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
      </div>
    </HofAppShell>
  );
}
