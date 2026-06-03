'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { colors, layoutWidth } from '@hof/design-tokens';
import { Icon, HofAppShell, useResponsive, FeedPost, EmptyState, ErrorState, FeedSkeletonCard } from '@hof/ui';
import type { NavId } from '@hof/ui';
import type { Post as UiPost } from '@hof/ui';
import { CHANNELS } from '../data/posts.js';
import { photoSrc } from '../data/photos.js';
import { navHref } from '../lib/nav.js';
import ComposerSheet from '../sheets/ComposerSheet.js';
import NotificationsSheet from '../sheets/NotificationsSheet.js';

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

export default function CommunityScreen() {
  const router = useRouter();
  const [apiPosts, setApiPosts] = useState<ApiPost[]>([]);
  const [activeChannel, setActiveChannel] = useState('general');
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const { isWide, isDesktop } = useResponsive();

  useEffect(() => {
    setLoadingPosts(true);
    setPostsError(false);
    fetch(`/api/posts?channel=${activeChannel}`)
      .then(r => r.json())
      .then((d: { posts?: ApiPost[] }) => { if (d.posts) setApiPosts(d.posts); else setApiPosts([]); })
      .catch(() => setPostsError(true))
      .finally(() => setLoadingPosts(false));
  }, [activeChannel]);

  const channelPosts = apiPosts.map(apiPostToUi);

  return (
    <HofAppShell active="community" onNav={(id: NavId) => router.push(navHref[id])}>
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
        background: colors.bg,
      }}
    >
      {/* Sticky top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: isWide ? '50%' : 0,
          right: isWide ? 'auto' : 0,
          transform: isWide ? 'translateX(-50%)' : undefined,
          width: isWide
            ? isDesktop
              ? `min(100%, ${layoutWidth.appDesktop}px)`
              : `min(100%, ${layoutWidth.app}px)`
            : 'auto',
          boxSizing: 'border-box',
          zIndex: 20,
          background: 'rgba(10,10,8,0.85)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          borderBottom: `1px solid ${colors.border}`,
          paddingTop: isWide ? 12 : 54,
        }}
      >
        {/* Header row */}
        <div
          style={{
            padding: '10px 16px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              Community
            </div>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 22,
                color: colors.text,
                letterSpacing: '-0.01em',
                marginTop: 2,
              }}
            >
              Board
            </div>
          </div>
          <button
            className="hof-btn hof-press"
            onClick={() => setNotifsOpen(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="bell" size={16} color={colors.text} />
          </button>
        </div>

        {/* Channel pills */}
        <div
          className="hof-scroll"
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 12,
          }}
        >
          {CHANNELS.map((ch) => {
            const isActive = activeChannel === ch.id;
            return (
              <button
                key={ch.id}
                className="hof-btn hof-press"
                disabled={ch.locked === true}
                onClick={() => {
                  if (!ch.locked) setActiveChannel(ch.id);
                }}
                style={{
                  flexShrink: 0,
                  padding: '7px 12px',
                  background: isActive ? colors.amber : colors.elevated,
                  border: `1px solid ${isActive ? colors.amber : colors.border}`,
                  borderRadius: 6,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 12,
                  color: ch.locked
                    ? colors.textDis
                    : isActive
                      ? colors.bg
                      : colors.text,
                  fontWeight: 500,
                  opacity: ch.locked ? 0.5 : 1,
                }}
              >
                #{ch.name}
                {ch.locked === true && (
                  <span style={{ marginLeft: 4, fontSize: 10 }}>🔒</span>
                )}
              </button>
            );
          })}
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
          paddingTop: isWide ? 120 : 160, // space for sticky header
        }}
      >
        {loadingPosts ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
            {[0, 1, 2, 3].map((i) => <FeedSkeletonCard key={i} />)}
          </div>
        ) : postsError ? (
          <ErrorState
            retry={() => {
              setLoadingPosts(true);
              setPostsError(false);
              fetch(`/api/posts?channel=${activeChannel}`)
                .then(r => r.json())
                .then((d: { posts?: ApiPost[] }) => { if (d.posts) setApiPosts(d.posts); else setApiPosts([]); })
                .catch(() => setPostsError(true))
                .finally(() => setLoadingPosts(false));
            }}
          />
        ) : channelPosts.length === 0 ? (
          /* Empty channel state */
          <EmptyState
            icon="users"
            title="Nothing yet"
            body="Be the first to post."
            action={
              <button
                className="hof-btn hof-press"
                onClick={() => setComposeOpen(true)}
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
                Start a thread
              </button>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
            {channelPosts.map((post) => (
              <FeedPost
                key={post.id}
                post={post}
                showChannel={activeChannel === 'general'}
                resolvePhoto={photoSrc}
                onOpen={() => router.push(`/community/${post.id}`)}
              />
            ))}
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>

      {/* Floating compose button */}
      <button
        className="hof-btn hof-press"
        onClick={() => setComposeOpen(true)}
        style={{
          position: 'absolute',
          right: 18,
          bottom: isWide ? 28 : 110,
          zIndex: 25,
          width: 52,
          height: 52,
          borderRadius: 26,
          background: colors.amber,
          border: `1px solid ${colors.amber}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(232,101,26,0.4)',
        }}
      >
        <Icon name="plus" size={22} color={colors.bg} />
      </button>

      {/* Overlays */}
      <ComposerSheet
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        defaultChannel={activeChannel}
        onPost={async (channel: string, title: string, body?: string) => {
          const r = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel, title, body }),
          });
          const d = await r.json() as { post?: ApiPost };
          if (d.post) { const np = d.post; setApiPosts(prev => [np, ...prev]); }
        }}
      />
      <NotificationsSheet
        open={notifsOpen}
        onClose={() => setNotifsOpen(false)}
        onOpenPost={(id) => {
          setNotifsOpen(false);
          router.push(`/community/${id}`);
        }}
      />
    </div>
    </HofAppShell>
  );
}
