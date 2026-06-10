'use client';

import { colors, spacing } from '@hof/design-tokens';
import type { ReactionKey } from '@hof/ui';
import { Avatar, ErrorState, FeedPost, FeedSkeletonCard, Icon, useToast } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAppHeader } from '@/hooks/useAppHeader';
import { useAuthUser } from '@/hooks/useAuthUser';
import { photoSrc } from '../data/photos';
import { apiPostToUi, timeAgo, type ApiPost } from '../lib/postUi';

interface PostScreenProps {
  postId: string;
}

type ApiReply = {
  id: string;
  body: string;
  is_anonymous: boolean;
  created_at: string;
  profiles: { handle: string; display_name: string; role: string; avatar_url: string | null } | null;
};

export default function PostScreen({ postId }: PostScreenProps) {
  const router = useRouter();
  const authUser = useAuthUser();
  const [apiPost, setApiPost] = useState<ApiPost | null>(null);
  const [replies, setReplies] = useState<ApiReply[]>([]);
  const [sending, setSending] = useState(false);
  const [myReactions, setMyReactions] = useState<string[]>([]);
  const [reply, setReply] = useState('');
  const [fetchDone, setFetchDone] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { showToast } = useToast();
  const cardSectionPad = `0 16px ${spacing[2]}px`;
  const cardTopPad = spacing[3];

  const handleBack = useCallback(() => router.back(), [router]);

  useAppHeader({
    title: 'Post',
    onBack: handleBack,
  });

  const loadPost = useCallback((options?: { silent?: boolean }) => {
    if (!postId) return;
    if (!options?.silent) {
      setFetchDone(false);
    }
    setFetchError(false);
    fetch(`/api/posts/${postId}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((d: { post?: ApiPost; replies?: ApiReply[]; myReactions?: string[] }) => {
        if (d.post) setApiPost(d.post);
        if (d.replies) setReplies(d.replies);
        if (d.myReactions) setMyReactions(d.myReactions);
      })
      .catch(() => setFetchError(true))
      .finally(() => setFetchDone(true));
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const toggleReaction = async (key: ReactionKey) => {
    const prevReaction = myReactions[0] ?? null;
    const removing = prevReaction === key;
    const nextReaction = removing ? null : key;
    setMyReactions(nextReaction ? [nextReaction] : []);

    if (apiPost) {
      const counts = { ...apiPost.reaction_counts };
      if (prevReaction) {
        const prevCount = counts[prevReaction] ?? 0;
        const nextCount = Math.max(0, prevCount - 1);
        if (nextCount === 0) delete counts[prevReaction];
        else counts[prevReaction] = nextCount;
      }
      if (nextReaction) {
        counts[nextReaction] = (counts[nextReaction] ?? 0) + 1;
      }
      setApiPost({ ...apiPost, reaction_counts: counts });
    }

    try {
      const r = await fetch(`/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: key }),
      });
      const d = (await r.json()) as {
        myReaction?: ReactionKey | null;
        reactionCounts?: Record<string, number>;
      };
      if (d.reactionCounts) {
        setApiPost((p) => (p ? { ...p, reaction_counts: d.reactionCounts! } : p));
      }
      if (d.myReaction !== undefined) {
        setMyReactions(d.myReaction ? [d.myReaction] : []);
      }
    } catch {
      setMyReactions(prevReaction ? [prevReaction] : []);
      if (apiPost) {
        const counts = { ...apiPost.reaction_counts };
        if (nextReaction) {
          const nextCount = counts[nextReaction] ?? 0;
          const reverted = Math.max(0, nextCount - 1);
          if (reverted === 0) delete counts[nextReaction];
          else counts[nextReaction] = reverted;
        }
        if (prevReaction) {
          counts[prevReaction] = (counts[prevReaction] ?? 0) + 1;
        }
        setApiPost({ ...apiPost, reaction_counts: counts });
      }
      showToast('Could not save reaction');
    }
  };

  const post = apiPost ? apiPostToUi(apiPost, { myReactions }) : null;

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
        <div style={{ fontFamily: 'Inter', fontSize: 14, color: colors.textSec }}>Post not found</div>
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
      <div className="hof-scroll hof-post-scroll">
        {!fetchDone && !fetchError && (
          <div style={{ padding: cardSectionPad, paddingTop: cardTopPad }}>
            <FeedSkeletonCard />
          </div>
        )}
        {fetchError && (
          <div style={{ padding: cardSectionPad, paddingTop: cardTopPad }}>
            <ErrorState retry={loadPost} />
          </div>
        )}
        {post && (
          <div style={{ padding: cardSectionPad, paddingTop: cardTopPad, position: 'relative' }}>
            <button
              type="button"
              className="hof-btn"
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                position: 'absolute',
                top: 18,
                right: 24,
                zIndex: 2,
                width: 32,
                height: 32,
                borderRadius: 16,
                background: colors.elevated,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Post options"
            >
              <Icon name="settings" size={14} color={colors.textSec} />
            </button>
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 54,
                  right: 24,
                  zIndex: 3,
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                  minWidth: 140,
                }}
              >
                <button
                  type="button"
                  className="hof-btn"
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: colors.error,
                  }}
                >
                  Report post
                </button>
              </div>
            )}
            <FeedPost
              post={post}
              resolvePhoto={photoSrc}
              interactiveReactions={post.moderationStatus === 'approved' || !post.moderationStatus}
              onReact={(emoji) => void toggleReaction(emoji)}
              pressFeedback={false}
            />
          </div>
        )}

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
                <Avatar
                  initials={rInitials}
                  userRole={rRole}
                  src={r.is_anonymous ? undefined : (r.profiles?.avatar_url ?? undefined)}
                  alt={rName}
                  size={30}
                />
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

      <div
        className="hof-post-composer"
        style={{
          zIndex: 20,
          background: 'rgba(10,10,8,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <Avatar
          initials={
            (authUser?.name ?? 'M')
              .split(' ')
              .map((p) => p[0] ?? '')
              .slice(0, 2)
              .join('')
              .toUpperCase()
          }
          userRole="member"
          src={authUser?.avatarUrl}
          alt={authUser?.name}
          size={28}
        />
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
            if (d.reply) {
              setReplies((prev) => [...prev, d.reply!]);
              if (apiPost) {
                setApiPost({ ...apiPost, reply_count: apiPost.reply_count + 1 });
              }
            }
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

      {reportOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setReportOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              background: colors.surface,
              borderRadius: 12,
              padding: 16,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 15, color: colors.text }}>
              Report this post
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: colors.textSec, marginTop: 6 }}>
              Why are you reporting it?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {['spam', 'harassment', 'inappropriate', 'off-topic'].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className="hof-btn hof-press"
                  onClick={async () => {
                    await fetch(`/api/posts/${postId}/report`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason }),
                    });
                    setReportOpen(false);
                    showToast('Report submitted — thanks for helping keep the board honest.', {
                      placement: 'above-composer',
                    });
                  }}
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    background: colors.elevated,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: colors.text,
                    textTransform: 'capitalize',
                  }}
                >
                  {reason.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
