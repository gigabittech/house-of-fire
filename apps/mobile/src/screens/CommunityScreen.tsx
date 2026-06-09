'use client';

import { colors, layoutChrome } from '@hof/design-tokens';
import type { ReactionKey } from '@hof/ui';
import {
  EmptyState,
  ErrorState,
  FeedPost,
  FeedSkeletonCard,
  Icon,
  useResponsive,
  useToast,
} from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCommunityRealtime } from '@/hooks/useCommunityRealtime';
import { AppHeaderIconButton } from '@/components/AppHeaderIconButton';
import { useAppHeader } from '@/hooks/useAppHeader';
import { useAppPageColumn } from '@/hooks/useAppPageColumn';
import { photoSrc } from '../data/photos';
import { CHANNELS } from '../data/posts';
import { apiPostToUi, type ApiPost } from '../lib/postUi';
import ComposerSheet from '../sheets/ComposerSheet';
import NotificationsSheet from '../sheets/NotificationsSheet';

type FeedView = 'channel' | 'mine';

export default function CommunityScreen() {
  const router = useRouter();
  const [apiPosts, setApiPosts] = useState<ApiPost[]>([]);
  const [myReactionsByPost, setMyReactionsByPost] = useState<Record<string, string[]>>({});
  const [activeChannel, setActiveChannel] = useState('general');
  const [feedView, setFeedView] = useState<FeedView>('channel');
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [liveEventId, setLiveEventId] = useState<string | undefined>();
  const { showToast } = useToast();
  const { isWide } = useResponsive();
  const pageColumn = useAppPageColumn();

  const scrollTopPad = isWide
    ? layoutChrome.wideActionsInset +
      36 +
      (feedView === 'channel' ? layoutChrome.wideChannelBarHeight : 0)
    : feedView === 'channel'
      ? 156
      : 116;

  useEffect(() => {
    fetch('/api/events/upcoming')
      .then((r) => r.json())
      .then((d: { event?: { id: string } }) => {
        if (d.event?.id) setLiveEventId(d.event.id);
      })
      .catch(console.error);
  }, []);

  const loadPosts = useCallback(() => {
    setLoadingPosts(true);
    setPostsError(false);

    if (feedView === 'mine') {
      fetch('/api/profile/posts')
        .then((r) => r.json())
        .then((d: { posts?: ApiPost[] }) => {
          setApiPosts(d.posts ?? []);
          setMyReactionsByPost({});
        })
        .catch(() => setPostsError(true))
        .finally(() => setLoadingPosts(false));
      return;
    }

    fetch(`/api/posts?channel=${activeChannel}&includeMyReactions=1`)
      .then((r) => r.json())
      .then(
        (d: { posts?: ApiPost[]; myReactionsByPost?: Record<string, string[]> }) => {
          setApiPosts(d.posts ?? []);
          setMyReactionsByPost(d.myReactionsByPost ?? {});
        },
      )
      .catch(() => setPostsError(true))
      .finally(() => setLoadingPosts(false));
  }, [activeChannel, feedView]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useCommunityRealtime({
    channel: feedView === 'channel' ? activeChannel : undefined,
    eventId: liveEventId,
    onPostInsert: () => loadPosts(),
    onPostUpdate: () => loadPosts(),
    enabled: feedView === 'channel',
  });

  const channelPosts = apiPosts.map((p) =>
    apiPostToUi(p, { myReactions: myReactionsByPost[p.id] }),
  );

  const handleReact = useCallback(
    async (postId: string, emoji: ReactionKey) => {
      const prevReactions = myReactionsByPost[postId] ?? [];
      const had = prevReactions.includes(emoji);
      const nextReactions = had
        ? prevReactions.filter((k) => k !== emoji)
        : [...prevReactions, emoji];

      setMyReactionsByPost((prev) => ({ ...prev, [postId]: nextReactions }));
      setApiPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const counts = { ...p.reaction_counts };
          const current = counts[emoji] ?? 0;
          counts[emoji] = Math.max(0, current + (had ? -1 : 1));
          if (counts[emoji] === 0) delete counts[emoji];
          return { ...p, reaction_counts: counts };
        }),
      );

      try {
        const r = await fetch(`/api/posts/${postId}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        });
        const d = (await r.json()) as {
          toggled?: boolean;
          reactionCounts?: Record<string, number>;
        };
        if (d.reactionCounts) {
          setApiPosts((prev) =>
            prev.map((p) =>
              p.id === postId ? { ...p, reaction_counts: d.reactionCounts! } : p,
            ),
          );
        }
      } catch {
        setMyReactionsByPost((prev) => ({ ...prev, [postId]: prevReactions }));
        loadPosts();
      }
    },
    [myReactionsByPost, loadPosts],
  );

  const headerActions = useMemo(
    () => (
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
    ),
    [],
  );

  useAppHeader({ title: 'Community', actions: headerActions });

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
        className="hof-app-page-sticky"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 20,
          background: 'rgba(10,10,8,0.85)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          // borderBottom: `1px solid ${colors.border}`,
          paddingTop: isWide ? layoutChrome.wideActionsInset : layoutChrome.mobilePageHeaderInset,
        }}
      >
        <div style={pageColumn}>
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginTop: isWide ? 0 : 4,
            paddingBottom: 8,
          }}
        >
          {(['channel', 'mine'] as const).map((view) => (
            <button
              key={view}
              type="button"
              className="hof-btn hof-press"
              onClick={() => setFeedView(view)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: feedView === view ? colors.elevated : 'transparent',
                border: `1px solid ${feedView === view ? colors.border : 'transparent'}`,
                fontFamily: 'Inter',
                fontSize: 12,
                fontWeight: 500,
                color: feedView === view ? colors.text : colors.textSec,
              }}
            >
              {view === 'channel' ? 'Board' : 'My posts'}
            </button>
          ))}
        </div>

        {feedView === 'channel' && (
          <div
            className="hof-scroll"
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
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
                    color: ch.locked ? colors.textDis : isActive ? colors.bg : colors.text,
                    fontWeight: 500,
                    opacity: ch.locked ? 0.5 : 1,
                  }}
                >
                  #{ch.name}
                  {ch.locked === true && <span style={{ marginLeft: 4, fontSize: 10 }}>🔒</span>}
                </button>
              );
            })}
          </div>
        )}
        </div>
      </div>

      <div
        className="hof-scroll hof-app-page-scroll"
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          paddingBottom: isWide ? layoutChrome.wideScrollBottom : layoutChrome.mobileScrollBottom,
          paddingTop: scrollTopPad,
        }}
      >
        <div style={pageColumn}>
        {loadingPosts ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <FeedSkeletonCard key={i} />
            ))}
          </div>
        ) : postsError ? (
          <ErrorState retry={loadPosts} />
        ) : channelPosts.length === 0 ? (
          <EmptyState
            icon="users"
            title={feedView === 'mine' ? 'No posts yet' : 'Nothing yet'}
            body={
              feedView === 'mine'
                ? 'Posts you submit will appear here with their review status.'
                : 'Be the first to post.'
            }
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {channelPosts.map((post) => (
              <FeedPost
                key={post.id}
                post={post}
                showChannel={activeChannel === 'general' && feedView === 'channel'}
                resolvePhoto={photoSrc}
                interactiveReactions={feedView === 'channel' && post.moderationStatus === 'approved'}
                onReact={(emoji) => void handleReact(post.id, emoji)}
                onOpen={() => router.push(`/community/${post.id}`)}
                pressFeedback={false}
              />
            ))}
          </div>
        )}

        <div style={{ height: 40 }} />
        </div>
      </div>

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

      <ComposerSheet
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        defaultChannel={activeChannel}
        eventId={liveEventId}
        onPost={async (channel, title, body, mediaUrls, isAnonymous) => {
          const r = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel,
              title,
              body,
              mediaUrls,
              eventId: liveEventId,
              isAnonymous,
            }),
          });
          if (!r.ok) {
            const err = (await r.json()) as { error?: string };
            throw new Error(err.error ?? 'Failed to post');
          }
          showToast('Submitted — pending review');
          if (feedView === 'mine') loadPosts();
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
  );
}
