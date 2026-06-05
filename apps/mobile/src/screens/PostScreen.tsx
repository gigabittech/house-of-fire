'use client';

import { colors, layoutChrome } from '@hof/design-tokens';
import type { ReactionKey, Post as UiPost } from '@hof/ui';
import { Avatar, ErrorState, FeedPost, FeedSkeletonCard, Icon, useResponsive } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAppHeader } from '@/hooks/useAppHeader';
import { photoSrc } from '../data/photos';
import { parseMediaUrls } from '../lib/postMedia';

interface PostScreenProps {
  postId: string;
}

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

type ApiReply = {
  id: string;
  body: string;
  is_anonymous: boolean;
  created_at: string;
  profiles: { handle: string; display_name: string; role: string } | null;
};

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function apiPostToUi(p: ApiPost, myReactions: string[]): UiPost {
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
  const reactions: Partial<Record<ReactionKey, number>> = {};
  for (const [k, v] of Object.entries(p.reaction_counts)) {
    if (['fire', 'heart', 'pray', 'music', 'eyes'].includes(k)) {
      (reactions as Record<string, number>)[k] = v;
    }
  }
  const myReaction = (myReactions.find((k) => k in reactions) ?? null) as ReactionKey | null;
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
    myReaction,
    replyCount: p.reply_count,
  };
}

const REACTION_OPTIONS: { key: ReactionKey; emoji: string }[] = [
  { key: 'fire', emoji: '🔥' },
  { key: 'heart', emoji: '❤️' },
  { key: 'music', emoji: '🎵' },
  { key: 'eyes', emoji: '👀' },
  { key: 'pray', emoji: '🙏' },
];

export default function PostScreen({ postId }: PostScreenProps) {
  const router = useRouter();
  const [apiPost, setApiPost] = useState<ApiPost | null>(null);
  const [replies, setReplies] = useState<ApiReply[]>([]);
  const [sending, setSending] = useState(false);
  const [myReactions, setMyReactions] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reply, setReply] = useState('');
  const [fetchDone, setFetchDone] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const { isWide } = useResponsive();

  const handleBack = useCallback(() => router.back(), [router]);

  useAppHeader({ title: 'Post', onBack: handleBack });

  const loadPost = useCallback(() => {
    if (!postId) return;
    setFetchDone(false);
    setFetchError(false);
    fetch(`/api/posts/${postId}`)
      .then((r) => r.json())
      .then((d: { post?: ApiPost; replies?: ApiReply[] }) => {
        if (d.post) setApiPost(d.post);
        if (d.replies) setReplies(d.replies);
      })
      .catch(() => setFetchError(true))
      .finally(() => setFetchDone(true));
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const toggleReaction = async (key: string) => {
    const r = await fetch(`/api/posts/${postId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: key }),
    });
    const d = (await r.json()) as { toggled?: boolean; reactionCounts?: Record<string, number> };
    if (d.toggled !== undefined) {
      setMyReactions((prev) => (d.toggled ? [...prev, key] : prev.filter((k) => k !== key)));
      if (d.reactionCounts && apiPost) {
        setApiPost((p) => (p ? { ...p, reaction_counts: d.reactionCounts! } : p));
      }
    }
  };

  const post = apiPost ? apiPostToUi(apiPost, myReactions) : null;

  if (fetchDone && !post) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: colors.bg,
          gap: 12,
        }}
      >
        <Icon name="chat" size={32} color={colors.textSec} />
        <div style={{ fontFamily: 'Inter', fontSize: 14, color: colors.textSec }}>
          Post not found
        </div>
        <button
          className="hof-btn hof-press"
          onClick={() => router.back()}
          style={{
            padding: '10px 20px',
            background: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            fontFamily: 'Inter',
            fontSize: 13,
            color: colors.text,
          }}
        >
          Go back
        </button>
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
      {/* Scrollable content */}
      <div
        className="hof-scroll"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: isWide ? '50%' : 0,
          right: isWide ? 'auto' : 0,
          transform: isWide ? 'translateX(-50%)' : undefined,
          width: isWide ? 'min(100%, 720px)' : 'auto',
          overflowY: 'auto',
          paddingBottom: 80,
          paddingTop: isWide ? 8 : layoutChrome.mobilePageHeaderInset,
        }}
      >
        {/* Post card */}
        {!fetchDone && !fetchError && (
          <div style={{ padding: '0 16px 8px' }}>
            <FeedSkeletonCard />
          </div>
        )}
        {fetchError && (
          <div style={{ padding: '0 16px 8px' }}>
            <ErrorState retry={loadPost} />
          </div>
        )}
        {post && (
          <div style={{ padding: '0 16px 8px' }}>
            <FeedPost post={post} resolvePhoto={photoSrc} />
          </div>
        )}

        {/* Reaction picker trigger */}
        <div
          style={{
            padding: '0 16px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <button
            className="hof-btn hof-press"
            onClick={() => setPickerOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: pickerOpen ? colors.elevated : 'transparent',
              border: `1px solid ${pickerOpen ? colors.borderHi : colors.border}`,
              borderRadius: 20,
              fontFamily: 'Inter',
              fontSize: 13,
              color: colors.textSec,
            }}
          >
            <span>React</span>
            <Icon name="flame" size={14} color={colors.amber} />
          </button>

          {/* Picker pills */}
          {pickerOpen && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              {REACTION_OPTIONS.map(({ key, emoji }) => (
                <button
                  key={key}
                  className="hof-btn hof-press"
                  onClick={() => {
                    void toggleReaction(key);
                    setPickerOpen(false);
                  }}
                  style={{
                    padding: '6px 10px',
                    background: myReactions.includes(key) ? `${colors.amber}22` : colors.elevated,
                    border: `1px solid ${myReactions.includes(key) ? colors.amber : colors.border}`,
                    borderRadius: 16,
                    fontSize: 16,
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Replies divider */}
        <div
          style={{
            padding: '0 16px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
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
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </div>
          <div style={{ flex: 1, height: 1, background: colors.border }} />
        </div>

        {/* Replies */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {replies.map((r, i) => {
            const rName = r.is_anonymous
              ? 'Anonymous'
              : (r.profiles?.display_name ?? r.profiles?.handle ?? 'Member');
            const rInitials =
              rName
                .split(' ')
                .map((w) => w[0] ?? '')
                .slice(0, 2)
                .join('')
                .toUpperCase() || '?';
            const rRole = (r.profiles?.role === 'crew' ? 'crew' : 'member') as 'crew' | 'member';
            return (
              <div
                key={r.id ?? i}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '12px 0',
                  borderBottom: i < replies.length - 1 ? `1px solid ${colors.border}` : 'none',
                }}
              >
                <Avatar initials={rInitials} userRole={rRole} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 500,
                        fontSize: 13,
                        color: colors.text,
                      }}
                    >
                      {rName}
                    </span>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: 10,
                        color: colors.textDis,
                        marginLeft: 'auto',
                      }}
                    >
                      {timeAgo(r.created_at)} ago
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 13,
                      color: colors.textSec,
                      lineHeight: 1.5,
                    }}
                  >
                    {r.body}
                  </div>
                </div>
              </div>
            );
          })}

          {replies.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 0',
                fontFamily: 'Inter',
                fontSize: 13,
                color: colors.textDis,
              }}
            >
              No replies yet — be first.
            </div>
          )}
        </div>

        <div style={{ height: 24 }} />
      </div>

      {/* Sticky compose bar at bottom (no bottom nav on post screen) */}
      <div
        style={{
          position: 'absolute',
          left: isWide ? '50%' : 0,
          right: isWide ? 'auto' : 0,
          bottom: 0,
          transform: isWide ? 'translateX(-50%)' : undefined,
          width: isWide ? 'min(100%, 720px)' : 'auto',
          boxSizing: 'border-box',
          zIndex: 20,
          background: 'rgba(10,10,8,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: `1px solid ${colors.border}`,
          padding: isWide ? '12px 16px 16px' : '10px 16px 34px',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <Avatar initials="SB" userRole="member" size={28} />
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Add a reply…"
          style={{
            flex: 1,
            padding: '10px 14px',
            background: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: 20,
            fontFamily: 'Inter',
            fontSize: 14,
            color: colors.text,
            outline: 'none',
          }}
        />
        <button
          className="hof-btn hof-press"
          disabled={reply.trim().length === 0 || sending}
          onClick={async () => {
            if (!reply.trim() || !postId || sending) return;
            setSending(true);
            const r = await fetch(`/api/posts/${postId}/replies`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ body: reply }),
            });
            const d = (await r.json()) as { reply?: ApiReply };
            if (d.reply) setReplies((prev) => [...prev, d.reply!]);
            setReply('');
            setSending(false);
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: reply.trim() ? colors.amber : colors.elevated,
            border: `1px solid ${reply.trim() ? colors.amber : colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon
            name="chev"
            size={16}
            color={reply.trim() ? colors.bg : colors.textDis}
            style={{ transform: 'rotate(-90deg)' }}
          />
        </button>
      </div>
    </div>
  );
}
