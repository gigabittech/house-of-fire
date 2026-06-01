'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@hof/design-tokens';
import { Icon, HofAppShell, useResponsive, FeedPost, HofSkeleton, ErrorState } from '@hof/ui';
import type { NavId } from '@hof/ui';
import type { Post as UiPost } from '@hof/ui';
import { photoSrc } from '../data/photos.js';
import { navHref } from '../lib/nav.js';

type ApiPost = {
  id: string;
  channel: string;
  title: string;
  body: string | null;
  is_anonymous: boolean;
  reply_count: number;
  reaction_counts: Record<string, number>;
  created_at: string;
  profiles: { handle: string; display_name: string; role: string; avatar_url: string | null } | null;
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
  const initials = displayName.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase() || '?';
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
      .then(r => r.json())
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
                borderBottom:
                  l !== 'heart reactions'
                    ? `1px solid ${colors.border}`
                    : 'none',
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
  const [profile, setProfile] = useState<null | {
    handle: string;
    display_name: string;
    member_since: string;
    role: string;
    avatar_url: string | null;
    tickets_count: number;
    editions_attended: number;
    recent_tickets: Array<{ code: string; events: { name: string; edition_number: number } | null }>;
  }>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [profileReactions, setProfileReactions] = useState({ fire: 0, eyes: 0, heart: 0 });
  const [referral, setReferral] = useState<{ referral_code: string; referral_count: number; conversions: number } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setProfileLoading(true);
    setProfileError(false);
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        if (d.profile) setProfile(d.profile);
        if (d.reactions) setProfileReactions(d.reactions as { fire: number; eyes: number; heart: number });
      })
      .catch(() => setProfileError(true))
      .finally(() => setProfileLoading(false));

    fetch('/api/profile/referral')
      .then(r => r.json())
      .then(d => { if (d.referral_code) setReferral(d as { referral_code: string; referral_count: number; conversions: number }); })
      .catch(() => {});
  }, []);

  const initials = (profile?.display_name ?? 'M')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const { isWide } = useResponsive();

  return (
    <HofAppShell active="profile" onNav={(id: NavId) => router.push(navHref[id])}>
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
          width: isWide ? 'min(100%, 912px)' : 'auto',
          overflowY: 'auto',
          paddingBottom: isWide ? 40 : 80,
        }}
      >
        <div style={{ height: 54 }} />

        <div
          style={{
            padding: '12px 16px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontFamily: 'Clash Display',
              fontWeight: 600,
              fontSize: 26,
              color: colors.text,
              letterSpacing: '-0.01em',
            }}
          >
            Profile
          </div>
          <button
            className="hof-btn hof-press"
            onClick={() => router.push('/profile/settings')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="settings" size={18} color={colors.text} />
          </button>
        </div>

        {/* Identity card */}
        <div style={{ padding: '12px 16px 0' }}>
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
                background:
                  'radial-gradient(circle, rgba(232,101,26,0.18), transparent 70%)',
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
                    ? new Date(profile.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : 'Recently'}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      background: 'rgba(201,148,42,0.1)',
                      border: `1px solid ${colors.gold}`,
                      borderRadius: 4,
                      fontFamily: 'Inter',
                      fontSize: 10,
                      fontWeight: 600,
                      color: colors.gold,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <Icon name="star" size={10} color={colors.gold} />
                    VIP Member
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
                  [String(profile?.editions_attended ?? 0), 'Editions'],
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

        {/* Tabs */}
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

        {tab === 'posts' && (
          <ProfilePosts
            onOpenPost={(id) => router.push('/community/' + id)}
            reactions={profileReactions}
          />
        )}

        {tab === 'overview' && (
          <>
            {/* Active ticket */}
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
                    <div
                      style={{
                        fontFamily: 'Inter',
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.16em',
                      }}
                    >
                      Jun
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
                      26
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
                      FRI
                    </div>
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
                        Fireversary · Ed 24
                      </div>
                      <div
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 12,
                          color: colors.textSec,
                          marginTop: 2,
                        }}
                      >
                        Junkyard Social Club · 8 PM
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
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
                    {referral.referral_count} friend{referral.referral_count !== 1 ? 's' : ''} joined · {referral.conversions} got tickets
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: '#8A8880',
                      lineHeight: 1.5,
                    }}
                  >
                    Share the fire — your friends skip the waitlist next edition.
                  </div>
                </div>
              </div>
            )}

            {/* History */}
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
                  Past tickets
                </div>
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: colors.amber,
                  }}
                >
                  View all {profile?.tickets_count ?? 0} →
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {(
                  [
                    {
                      d: '23',
                      m: 'May',
                      y: '2026',
                      n: 'Ed 23 · Late Bloom',
                      t: 'GA',
                      a: true,
                    },
                    {
                      d: '25',
                      m: 'Apr',
                      y: '2026',
                      n: 'Ed 22 · Slow Burn',
                      t: 'VIP',
                      a: true,
                    },
                    {
                      d: '28',
                      m: 'Mar',
                      y: '2026',
                      n: 'Ed 21 · The Equinox',
                      t: 'GA',
                      a: false,
                    },
                  ] as { d: string; m: string; y: string; n: string; t: string; a: boolean }[]
                ).map((it, i) => (
                  <div
                    key={i}
                    style={{
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
                        background: colors.elevated,
                        border: `1px solid ${colors.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 8,
                          color: colors.textSec,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {it.m}
                      </div>
                      <div
                        style={{
                          fontFamily: 'Clash Display',
                          fontWeight: 600,
                          fontSize: 18,
                          color: colors.text,
                          lineHeight: 1,
                          marginTop: 2,
                        }}
                      >
                        {it.d}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'Inter',
                          fontWeight: 500,
                          fontSize: 14,
                          color: colors.text,
                        }}
                      >
                        {it.n}
                      </div>
                      <div
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 11,
                          color: colors.textSec,
                          marginTop: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {it.t} ·{' '}
                        {it.a ? (
                          <>
                            <Icon
                              name="check"
                              size={11}
                              color={colors.success}
                            />{' '}
                            Attended
                          </>
                        ) : (
                          'Missed'
                        )}
                      </div>
                    </div>
                    <Icon name="chev" size={14} color={colors.textDis} />
                  </div>
                ))}
              </div>
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
                    [
                      'Notifications',
                      'On · Push & email',
                      '/profile/settings',
                    ],
                    ['Payment methods', 'Visa ···· 4242', '/profile/settings'],
                    ['Privacy & data', null, '/profile/settings'],
                    ['Help & contact', null, '/profile/settings'],
                    ['Log out', null, null],
                  ] as [string, string | null, string | null][]
                ).map(([t, sub, href], i, a) => (
                  <button
                    key={t}
                    className="hof-btn hof-press"
                    onClick={() => {
                      if (href) router.push(href);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      borderBottom:
                        i < a.length - 1
                          ? `1px solid ${colors.border}`
                          : 'none',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 14,
                          color:
                            t === 'Log out' ? colors.error : colors.text,
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
                    {t !== 'Log out' && (
                      <Icon name="chev" size={14} color={colors.textDis} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
    </HofAppShell>
  );
}
