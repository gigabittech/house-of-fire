'use client';

import { colors, layoutChrome, layoutWidth } from '@hof/design-tokens';
import type { Post as UiPost } from '@hof/ui';
import {
  EmptyState,
  ErrorState,
  FeedPost,
  HofSkeleton,
  Icon,
  useResponsive,
} from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppHeaderIconButton } from '@/components/AppHeaderIconButton';
import { useAppHeader } from '@/hooks/useAppHeader';
import { COMMUNITY_FEATURE_ENABLED } from '@/lib/features';
import { formatDoorsRange } from '@/lib/eventDisplay';
import { photoSrc } from '../data/photos';
import { parseMediaUrls } from '../lib/postMedia';
import { createClient } from '../lib/supabase';

type ApiPost = {
  id: string;
  channel: string;
  title: string;
  body: string | null;
  is_anonymous: boolean;
  reply_count: number;
  reaction_counts: Record<string, number>;
  media_urls?: unknown;
  created_at: string;
  profiles: {
    handle: string;
    display_name: string;
    role: string;
    avatar_url: string | null;
  } | null;
};

type ProfileTicket = {
  id: string;
  code: string;
  status: string;
  purchased_at: string;
  amount_cents: number;
  fee_cents: number;
  used_at: string | null;
  events: {
    name: string;
    date: string;
    edition_number: number;
    venue_name: string;
    doors_open: string;
    doors_close?: string;
  } | null;
  ticket_tiers: { display_name: string; name: string } | null;
};

type ProfileData = {
  handle: string;
  display_name: string;
  member_since: string;
  role: string;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  tickets_count: number;
  editions_attended: number;
};

function formatTicketPrice(cents: number, feeCents: number): string {
  return `$${((cents + feeCents) / 100).toFixed(2)}`;
}

function ticketStatusLabel(status: string, usedAt: string | null): string {
  if (status === 'used' || usedAt) return 'Attended';
  const labels: Record<string, string> = {
    valid: 'Confirmed',
    transferred: 'Transferred',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
  };
  return labels[status] ?? status;
}

function isUpcomingTicket(t: ProfileTicket): boolean {
  if (t.status !== 'valid') return false;
  const eventDate = t.events?.date;
  if (!eventDate) return true;
  return new Date(eventDate).getTime() >= Date.now();
}

function eventDateParts(iso: string): { month: string; day: string; weekday: string } {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    day: d.toLocaleDateString('en-US', { day: 'numeric' }),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
  };
}

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
    imageUrls: parseMediaUrls(p.media_urls),
    reactions,
    replyCount: p.reply_count,
  };
}

function ProfileTicketRow({ ticket, onOpen }: { ticket: ProfileTicket; onOpen: () => void }) {
  const ev = ticket.events;
  const tierName = ticket.ticket_tiers?.display_name ?? ticket.ticket_tiers?.name ?? 'Ticket';
  const purchased = new Date(ticket.purchased_at);
  const parts = ev?.date ? eventDateParts(ev.date) : null;
  const status = ticketStatusLabel(ticket.status, ticket.used_at);
  const isConfirmed = ticket.status === 'valid' && !ticket.used_at;

  return (
    <button
      type="button"
      className="hof-btn hof-press"
      onClick={onOpen}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 12,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          flexShrink: 0,
          background: isUpcomingTicket(ticket)
            ? `linear-gradient(135deg, ${colors.ember}, ${colors.amber})`
            : colors.elevated,
          border: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: isUpcomingTicket(ticket) ? colors.bg : colors.text,
        }}
      >
        {parts ? (
          <>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: 0.9,
              }}
            >
              {parts.month}
            </div>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 18,
                lineHeight: 1,
                marginTop: 2,
              }}
            >
              {parts.day}
            </div>
          </>
        ) : (
          <Icon name="ticket" size={18} color={colors.textSec} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 14,
            color: colors.text,
          }}
        >
          {ev ? `Theme ${ev.edition_number} · ${ev.name}` : ticket.code}
        </div>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 11,
            color: colors.textSec,
            marginTop: 2,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            alignItems: 'center',
          }}
        >
          <span>{tierName}</span>
          <span>·</span>
          <span>{formatTicketPrice(ticket.amount_cents, ticket.fee_cents)}</span>
          <span>·</span>
          <span>
            {purchased.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <div
          style={{
            marginTop: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 20,
            background: isConfirmed ? 'rgba(232,101,26,0.12)' : colors.elevated,
            border: `1px solid ${isConfirmed ? `${colors.amber}40` : colors.border}`,
            fontFamily: 'Inter',
            fontSize: 10,
            fontWeight: 600,
            color: isConfirmed ? colors.glow : colors.textSec,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {isConfirmed && <Icon name="check" size={10} color={colors.glow} />}
          {status}
        </div>
      </div>
      <Icon name="chev" size={14} color={colors.textDis} />
    </button>
  );
}

function ProfilePosts({
  onOpenPost,
  reactions,
}: {
  onOpenPost: (id: string) => void;
  reactions: { fire: number; eyes: number; heart: number };
}) {
  const [myPosts, setMyPosts] = useState<UiPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState(false);

  useEffect(() => {
    setLoadingPosts(true);
    setPostsError(false);
    fetch('/api/profile/posts')
      .then((r) => r.json())
      .then((d: { posts?: ApiPost[] }) => {
        if (d.posts) setMyPosts(d.posts.map(apiPostToUi));
      })
      .catch(() => setPostsError(true))
      .finally(() => setLoadingPosts(false));
  }, []);

  return (
    <div style={{ padding: '20px 16px 0' }}>
      {/* Activity stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          padding: '14px 16px',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
        }}
      >
        {(
          [
            [String(myPosts.length), 'Posts'],
            [String(reactions.fire + reactions.eyes + reactions.heart), '🔥 Received'],
            [String(myPosts.reduce((s, p) => s + (p.replyCount ?? 0), 0)), 'Replies'],
          ] as [string, string][]
        ).map(([n, l]) => (
          <div key={l}>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 22,
                color: colors.text,
                letterSpacing: '-0.01em',
                fontVariantNumeric: 'tabular-nums',
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
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {l}
            </div>
          </div>
        ))}
      </div>

      {/* Your posts */}
      <div style={{ marginTop: 20 }}>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 10,
            color: colors.textSec,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Your posts
        </div>
        {loadingPosts ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <HofSkeleton width="55%" height={14} />
                <HofSkeleton width="100%" height={12} />
                <HofSkeleton width="75%" height={12} />
              </div>
            ))}
          </div>
        ) : postsError ? (
          <ErrorState />
        ) : myPosts.length === 0 ? (
          <div
            style={{
              padding: '24px 18px',
              textAlign: 'center',
              background: colors.surface,
              border: `1px dashed ${colors.border}`,
              borderRadius: 12,
              fontFamily: 'Inter',
              fontSize: 13,
              color: colors.textSec,
            }}
          >
            You haven&apos;t posted yet. Go say hello in #general.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {myPosts.map((p) => (
              <FeedPost
                key={p.id}
                post={p}
                compact
                onOpen={() => onOpenPost(p.id)}
                resolvePhoto={photoSrc}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reactions received */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 10,
            color: colors.textSec,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Reactions to your posts
        </div>
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: '14px 16px',
          }}
        >
          {(
            [
              ['🔥', reactions.fire, 'fire reactions'],
              ['👀', reactions.eyes, 'eyes reactions'],
              ['❤️', reactions.heart, 'heart reactions'],
            ] as [string, number, string][]
          ).map(([emoji, n, l]) => (
            <div
              key={l}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                borderBottom: l !== 'heart reactions' ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <span style={{ fontSize: 18 }}>{emoji}</span>
              <div
                style={{
                  flex: 1,
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: colors.text,
                }}
              >
                {l}
              </div>
              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 13,
                  color: colors.text,
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 500,
                }}
              >
                {n}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'overview' | 'posts'>('overview');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [tickets, setTickets] = useState<ProfileTicket[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [profileReactions, setProfileReactions] = useState({ fire: 0, eyes: 0, heart: 0 });
  const [referral, setReferral] = useState<{
    referral_code: string;
    referral_count: number;
    conversions: number;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadProfile = useCallback(() => {
    setProfileLoading(true);
    setProfileError(false);
    fetch('/api/profile')
      .then(async (r) => {
        if (!r.ok) throw new Error('profile fetch failed');
        return r.json() as Promise<{
          profile?: ProfileData;
          tickets?: ProfileTicket[];
          reactions?: { fire: number; eyes: number; heart: number };
        }>;
      })
      .then((d) => {
        if (d.profile) setProfile(d.profile);
        setTickets(d.tickets ?? []);
        if (d.reactions) setProfileReactions(d.reactions);
      })
      .catch(() => setProfileError(true))
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
    fetch('/api/profile/referral')
      .then((r) => r.json())
      .then((d) => {
        if (d.referral_code)
          setReferral(d as { referral_code: string; referral_count: number; conversions: number });
      })
      .catch(() => {});

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') loadProfile();
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [loadProfile]);

  const upcomingTicket = tickets.find(isUpcomingTicket);
  const roleLabel =
    profile?.role === 'crew' ? 'Crew' : profile?.role === 'admin' ? 'Admin' : 'Member';

  const initials = (profile?.display_name ?? 'M')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const { isWide, isDesktop } = useResponsive();

  const headerActions = useMemo(
    () => (
      <AppHeaderIconButton
        icon="settings"
        label="Settings"
        onClick={() => router.push('/profile/settings')}
      />
    ),
    [router],
  );

  useAppHeader({ title: 'Profile', actions: headerActions });

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
            paddingTop: isWide ? layoutChrome.wideActionsInset : 0,
            paddingBottom: isWide ? layoutChrome.wideScrollBottom : layoutChrome.mobileScrollBottom,
          }}
        >
          {/* Identity card */}
          <div style={{ padding: isWide ? '8px 16px 0' : '12px 16px 0' }}>
            {profileError ? (
              <ErrorState />
            ) : profileLoading ? (
              <div
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <HofSkeleton width={64} height={64} radius={32} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <HofSkeleton width="55%" height={18} />
                    <HofSkeleton width="70%" height={12} />
                    <HofSkeleton width={80} height={20} radius={4} style={{ marginTop: 2 }} />
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: `1px solid ${colors.border}`,
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <HofSkeleton width="50%" height={22} />
                      <HofSkeleton width="70%" height={10} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  position: 'relative',
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: 20,
                  overflow: 'hidden',
                }}
              >
                {/* warm glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: -60,
                    right: -60,
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    background: 'radial-gradient(circle, rgba(232,101,26,0.18), transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    position: 'relative',
                  }}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        flexShrink: 0,
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        flexShrink: 0,
                        background: `linear-gradient(135deg, ${colors.amber}, ${colors.ember})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Clash Display',
                        fontWeight: 700,
                        fontSize: 28,
                        color: colors.bg,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div>
                    <div
                      style={{
                        fontFamily: 'Clash Display',
                        fontWeight: 600,
                        fontSize: 22,
                        color: colors.text,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {profile?.display_name ?? 'Member'}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Inter',
                        fontSize: 12,
                        color: colors.textSec,
                        marginTop: 2,
                      }}
                    >
                      {profile?.handle ? `@${profile.handle}` : '@member'} · Member since{' '}
                      {profile?.member_since
                        ? new Date(profile.member_since).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Recently'}
                    </div>
                    {profile?.email && (
                      <div
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 12,
                          color: colors.textSec,
                          marginTop: 4,
                        }}
                      >
                        {profile.email}
                      </div>
                    )}
                    {profile?.phone && (
                      <div
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 12,
                          color: colors.textSec,
                          marginTop: 2,
                        }}
                      >
                        {profile.phone}
                      </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          background:
                            profile?.role === 'crew' || profile?.role === 'admin'
                              ? 'rgba(232,101,26,0.12)'
                              : 'rgba(201,148,42,0.1)',
                          border: `1px solid ${profile?.role === 'crew' || profile?.role === 'admin' ? colors.amber : colors.gold}`,
                          borderRadius: 4,
                          fontFamily: 'Inter',
                          fontSize: 10,
                          fontWeight: 600,
                          color:
                            profile?.role === 'crew' || profile?.role === 'admin'
                              ? colors.amber
                              : colors.gold,
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                        }}
                      >
                        <Icon
                          name="star"
                          size={10}
                          color={
                            profile?.role === 'crew' || profile?.role === 'admin'
                              ? colors.amber
                              : colors.gold
                          }
                        />
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    marginTop: 18,
                    padding: '14px 0 0',
                    borderTop: `1px solid ${colors.border}`,
                    position: 'relative',
                  }}
                >
                  {(
                    [
                      [String(profile?.editions_attended ?? 0), 'Themes'],
                      [String(profile?.tickets_count ?? 0), 'Tickets'],
                      ['—', 'Photos'],
                    ] as [string, string][]
                  ).map(([n, l]) => (
                    <div key={l}>
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
              </div>
            )}
          </div>

          {/* Tabs — COMMUNITY_FEATURE hides Posts tab */}
          {COMMUNITY_FEATURE_ENABLED ? (
          <div style={{ padding: '20px 16px 0' }}>
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: 4,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
              }}
            >
              {(
                [
                  ['overview', 'Overview'],
                  ['posts', 'Posts'],
                ] as ['overview' | 'posts', string][]
              ).map(([k, l]) => (
                <button
                  key={k}
                  className="hof-btn hof-press"
                  onClick={() => setTab(k)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: tab === k ? colors.elevated : 'transparent',
                    fontFamily: 'Inter',
                    fontSize: 13,
                    fontWeight: 500,
                    color: tab === k ? colors.text : colors.textSec,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          ) : null}

          {tab === 'posts' && COMMUNITY_FEATURE_ENABLED && (
            <ProfilePosts
              onOpenPost={(id) => router.push('/community/' + id)}
              reactions={profileReactions}
            />
          )}

          {tab === 'overview' && (
            <>
              {/* Upcoming ticket */}
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
                  Upcoming ticket
                </div>
                {upcomingTicket && upcomingTicket.events ? (
                  <button
                    className="hof-btn hof-press"
                    onClick={() => router.push('/ticket')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: 0,
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 12,
                      overflow: 'hidden',
                      display: 'block',
                    }}
                  >
                    <div style={{ display: 'flex' }}>
                      <div
                        style={{
                          width: 96,
                          background: `linear-gradient(135deg, ${colors.ember}, ${colors.amber})`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 12,
                          color: colors.bg,
                        }}
                      >
                        {(() => {
                          const p = eventDateParts(upcomingTicket.events.date);
                          return (
                            <>
                              <div
                                style={{
                                  fontFamily: 'Inter',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.16em',
                                }}
                              >
                                {p.month}
                              </div>
                              <div
                                style={{
                                  fontFamily: 'Clash Display',
                                  fontWeight: 700,
                                  fontSize: 38,
                                  lineHeight: 1,
                                  letterSpacing: '-0.02em',
                                  marginTop: 2,
                                }}
                              >
                                {p.day}
                              </div>
                              <div
                                style={{
                                  fontFamily: 'Inter',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.16em',
                                  marginTop: 2,
                                }}
                              >
                                {p.weekday}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          padding: 14,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontFamily: 'Clash Display',
                              fontWeight: 600,
                              fontSize: 16,
                              color: colors.text,
                            }}
                          >
                            {upcomingTicket.events.name} · Th {upcomingTicket.events.edition_number}
                          </div>
                          <div
                            style={{
                              fontFamily: 'Inter',
                              fontSize: 12,
                              color: colors.textSec,
                              marginTop: 2,
                            }}
                          >
                            {upcomingTicket.events.venue_name}
                            {upcomingTicket.events.doors_open
                              ? ` · Doors ${formatDoorsRange(upcomingTicket.events.doors_open, upcomingTicket.events.doors_close)}`
                              : ''}
                          </div>
                          <div
                            style={{
                              fontFamily: 'Inter',
                              fontSize: 11,
                              color: colors.textSec,
                              marginTop: 4,
                            }}
                          >
                            {upcomingTicket.ticket_tiers?.display_name ??
                              upcomingTicket.ticket_tiers?.name ??
                              'Ticket'}
                            {' · '}
                            {formatTicketPrice(
                              upcomingTicket.amount_cents,
                              upcomingTicket.fee_cents,
                            )}
                          </div>
                        </div>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 8px',
                              borderRadius: 20,
                              background: 'rgba(232,101,26,0.15)',
                              border: `1px solid ${colors.amber}30`,
                              fontFamily: 'Inter',
                              fontSize: 11,
                              fontWeight: 600,
                              color: colors.glow,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                            }}
                          >
                            <Icon name="qr" size={10} color={colors.glow} /> Tap to open QR
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div
                    style={{
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 12,
                      padding: 4,
                    }}
                  >
                    <EmptyState
                      title="No upcoming ticket"
                      body="Get your ticket for the next theme."
                      action={
                        <button
                          type="button"
                          className="hof-btn hof-press"
                          onClick={() => router.push('/checkout')}
                          style={{
                            padding: '10px 24px',
                            background: colors.amber,
                            border: `1px solid ${colors.amber}`,
                            borderRadius: 8,
                            fontFamily: 'Inter',
                            fontWeight: 600,
                            fontSize: 14,
                            color: colors.bg,
                          }}
                        >
                          Get tickets
                        </button>
                      }
                    />
                  </div>
                )}
              </div>

              {/* Referral card */}
              {referral !== null && (
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
                    Referral
                  </div>
                  <div
                    style={{
                      background: '#141412',
                      border: '1px solid #2A2826',
                      borderRadius: 10,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'Inter',
                        fontSize: 9,
                        color: '#8A8880',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      Your code
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono',
                          fontSize: 18,
                          fontWeight: 600,
                          color: '#F0EDE6',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {referral.referral_code}
                      </span>
                      <button
                        className="hof-btn hof-press"
                        onClick={() => {
                          void navigator.clipboard.writeText(referral.referral_code).then(() => {
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          });
                        }}
                        style={{
                          padding: '5px 12px',
                          background: 'transparent',
                          border: '1px solid #2A2826',
                          borderRadius: 6,
                          fontFamily: 'Inter',
                          fontSize: 12,
                          fontWeight: 500,
                          color: copiedCode ? colors.success : colors.text,
                          cursor: 'pointer',
                        }}
                      >
                        {copiedCode ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div
                      style={{
                        fontFamily: 'Inter',
                        fontSize: 12,
                        color: '#8A8880',
                        marginBottom: 8,
                      }}
                    >
                      {referral.referral_count} friend{referral.referral_count !== 1 ? 's' : ''}{' '}
                      joined · {referral.conversions} got tickets
                    </div>
                    <div
                      style={{
                        fontFamily: 'Inter',
                        fontSize: 12,
                        color: '#8A8880',
                        lineHeight: 1.5,
                      }}
                    >
                      Share the fire — your friends skip the waitlist next theme.
                    </div>
                  </div>
                </div>
              )}

              {/* Ticket history */}
              <div style={{ padding: '28px 16px 0' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 10,
                      color: colors.textSec,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Your tickets
                  </div>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: colors.textSec,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {tickets.length} total
                  </span>
                </div>
                {tickets.length === 0 ? (
                  <div
                    style={{
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 12,
                      padding: 4,
                    }}
                  >
                    <EmptyState
                      title="No tickets yet"
                      body="Your purchases will show up here after checkout."
                      action={
                        <button
                          type="button"
                          className="hof-btn hof-press"
                          onClick={() => router.push('/checkout')}
                          style={{
                            padding: '10px 24px',
                            background: colors.amber,
                            border: `1px solid ${colors.amber}`,
                            borderRadius: 8,
                            fontFamily: 'Inter',
                            fontWeight: 600,
                            fontSize: 14,
                            color: colors.bg,
                          }}
                        >
                          Browse tickets
                        </button>
                      }
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tickets.map((t) => (
                      <ProfileTicketRow
                        key={t.id}
                        ticket={t}
                        onOpen={() => router.push('/ticket')}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Account settings */}
              <div style={{ padding: '28px 16px 0' }}>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 10,
                    color: colors.textSec,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  Account
                </div>
                <div
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {(
                    [
                      ['Notifications', 'On · Push & email', '/profile/settings'],
                      ['Payment methods', 'Managed at checkout', '/profile/settings'],
                      ['Privacy & data', null, '/profile/settings'],
                      ['Help & contact', null, '/profile/settings'],
                      ['Log out', null, null],
                    ] as [string, string | null, string | null][]
                  ).map(([t, sub, href], i, a) => (
                    <button
                      key={t}
                      className="hof-btn hof-press"
                      onClick={async () => {
                        if (t === 'Log out') {
                          const supabase = createClient();
                          await supabase.auth.signOut();
                          router.push('/landing');
                          return;
                        }
                        if (href) router.push(href);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '14px 16px',
                        borderBottom: i < a.length - 1 ? `1px solid ${colors.border}` : 'none',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: 'Inter',
                            fontSize: 14,
                            color: t === 'Log out' ? colors.error : colors.text,
                          }}
                        >
                          {t}
                        </div>
                        {sub && (
                          <div
                            style={{
                              fontFamily: 'Inter',
                              fontSize: 12,
                              color: colors.textSec,
                              marginTop: 2,
                            }}
                          >
                            {sub}
                          </div>
                        )}
                      </div>
                      {t !== 'Log out' && <Icon name="chev" size={14} color={colors.textDis} />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={{ height: 24 }} />
        </div>
      </div>
  );
}
