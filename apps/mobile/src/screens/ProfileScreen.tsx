'use client';

import { colors, layoutChrome } from '@hof/design-tokens';
import type { Post as UiPost } from '@hof/ui';
import { EmptyState, ErrorState, FeedPost, HofSkeleton, Icon, useResponsive } from '@hof/ui';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { AppHeaderIconButton } from '@/components/AppHeaderIconButton';
import { useAppHeader } from '@/hooks/useAppHeader';
import { useAppPageColumn } from '@/hooks/useAppPageColumn';
import { COMMUNITY_FEATURE_ENABLED } from '@/lib/features';
import { formatDoorsRange } from '@/lib/eventDisplay';
import {
  clearProfileCache,
  notifyProfileUpdated,
  patchProfileCache,
  readProfileCache,
  writeProfileCache,
} from '@/lib/profileCache';
import type { ProfileData, ProfileTicket } from '@/lib/profileTypes';
import { uploadProfileAvatar } from '@/lib/storageUpload';
import { photoSrc } from '../data/photos';
import { apiPostToUi } from '../lib/postUi';
import { createClient } from '../lib/supabase';

function ProfileNameField({
  displayName,
  editing,
  onEditingChange,
  onSave,
  saving,
}: {
  displayName: string;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onSave: (name: string) => Promise<void>;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(displayName);
  }, [displayName, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const cancel = () => {
    setDraft(displayName);
    onEditingChange(false);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === displayName) {
      cancel();
      return;
    }
    await onSave(trimmed);
    onEditingChange(false);
  };

  if (!editing) {
    return (
      <div
        style={{
          fontFamily: 'Clash Display',
          fontWeight: 600,
          fontSize: 22,
          color: colors.text,
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {displayName}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void save();
          if (e.key === 'Escape') cancel();
        }}
        maxLength={80}
        disabled={saving}
        style={{
          width: '100%',
          padding: '6px 0 8px',
          border: 'none',
          borderBottom: `2px solid ${colors.amber}`,
          background: 'transparent',
          fontFamily: 'Clash Display',
          fontWeight: 600,
          fontSize: 22,
          color: colors.text,
          outline: 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          className="hof-btn hof-press"
          disabled={saving}
          onClick={() => {
            void save();
          }}
          style={{
            padding: 0,
            background: 'transparent',
            fontFamily: 'Inter',
            fontSize: 12,
            fontWeight: 600,
            color: colors.amber,
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          className="hof-btn hof-press"
          disabled={saving}
          onClick={cancel}
          style={{
            padding: 0,
            background: 'transparent',
            fontFamily: 'Inter',
            fontSize: 12,
            fontWeight: 500,
            color: colors.textSec,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

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

function ProfileRoleBadge({ role }: { role: string | undefined }) {
  const roleLabel = role === 'crew' ? 'Crew' : role === 'admin' ? 'Admin' : 'Member';
  const isStaff = role === 'crew' || role === 'admin';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        background: isStaff ? 'rgba(232,101,26,0.14)' : 'rgba(201,148,42,0.12)',
        border: `1px solid ${isStaff ? colors.amber : colors.gold}`,
        borderRadius: 6,
        fontFamily: 'Inter',
        fontSize: 10,
        fontWeight: 600,
        color: isStaff ? colors.amber : colors.gold,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        boxShadow: isStaff ? '0 0 20px rgba(232,101,26,0.15)' : '0 0 16px rgba(201,148,42,0.12)',
      }}
    >
      <Icon name="star" size={10} color={isStaff ? colors.amber : colors.gold} />
      {roleLabel}
    </span>
  );
}

function ProfileSectionLabel({
  children,
  accent,
  style,
}: {
  children: ReactNode;
  accent?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: 'Inter',
        fontSize: 10,
        color: accent ? colors.amber : colors.textSec,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        marginBottom: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
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
        padding: 14,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        transition: 'border-color 150ms, box-shadow 150ms',
        boxShadow: '0 1px 0 rgba(255,255,255,0.02)',
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
    <div style={{ padding: '20px 0 0' }}>
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
  const [profile, setProfile] = useState<ProfileData | null>(
    () => readProfileCache()?.profile ?? null,
  );
  const [tickets, setTickets] = useState<ProfileTicket[]>(() => readProfileCache()?.tickets ?? []);
  const [profileLoading, setProfileLoading] = useState(() => !readProfileCache()?.profile);
  const [profileError, setProfileError] = useState(false);
  const [profileReactions, setProfileReactions] = useState(
    () => readProfileCache()?.reactions ?? { fire: 0, eyes: 0, heart: 0 },
  );
  const [referral, setReferral] = useState<{
    referral_code: string;
    referral_count: number;
    conversions: number;
  } | null>(() => readProfileCache()?.referral ?? null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback((options?: { silent?: boolean }) => {
    const silent = options?.silent ?? Boolean(readProfileCache()?.profile);
    if (!silent) {
      setProfileLoading(true);
      setProfileError(false);
    }
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
        writeProfileCache({
          profile: d.profile ?? null,
          tickets: d.tickets ?? [],
          reactions: d.reactions ?? { fire: 0, eyes: 0, heart: 0 },
          referral: readProfileCache()?.referral ?? null,
        });
      })
      .catch(() => {
        if (!silent) setProfileError(true);
      })
      .finally(() => {
        if (!silent) setProfileLoading(false);
      });
  }, []);

  useEffect(() => {
    const snapshot = readProfileCache();
    loadProfile({ silent: Boolean(snapshot?.profile) });
    if (!snapshot?.referral) {
      fetch('/api/profile/referral')
        .then((r) => r.json())
        .then((d) => {
          if (d.referral_code) {
            const next = d as {
              referral_code: string;
              referral_count: number;
              conversions: number;
            };
            setReferral(next);
            writeProfileCache({ referral: next });
          }
        })
        .catch(() => {});
    }
  }, [loadProfile]);

  const saveDisplayName = useCallback(async (trimmed: string) => {
    setSavingName(true);
    setProfileSaveError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: trimmed }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? 'Could not save name');
      }
      const data = (await res.json()) as { profile?: { display_name: string } };
      if (data.profile?.display_name) {
        const nextName = data.profile.display_name;
        setProfile((prev) => (prev ? { ...prev, display_name: nextName } : prev));
        patchProfileCache({ display_name: nextName });
        notifyProfileUpdated();
      }
    } catch (err) {
      setProfileSaveError(err instanceof Error ? err.message : 'Could not save name');
      throw err;
    } finally {
      setSavingName(false);
    }
  }, []);

  const handleAvatarSelect = useCallback(async (file: File | undefined) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarUploading(true);
    setProfileSaveError(null);
    try {
      const publicUrl = await uploadProfileAvatar(file);
      setAvatarPreview(null);
      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
      patchProfileCache({ avatar_url: publicUrl });
      notifyProfileUpdated();
    } catch (err) {
      setAvatarPreview(null);
      setProfileSaveError(err instanceof Error ? err.message : 'Could not update photo');
    } finally {
      setAvatarUploading(false);
      URL.revokeObjectURL(preview);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }, []);

  const upcomingTicket = tickets.find(isUpcomingTicket);

  const initials = (profile?.display_name ?? 'M')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const { isWide } = useResponsive();
  const pageColumn = useAppPageColumn();

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
      <div
        className="hof-scroll hof-app-page-scroll"
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          paddingTop: isWide ? layoutChrome.wideActionsInset : 0,
          paddingBottom: isWide ? layoutChrome.wideScrollBottom : layoutChrome.mobileScrollBottom,
        }}
      >
        <div style={{ ...pageColumn, paddingTop: isWide ? 8 : 12 }}>
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
              <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
                <ProfileRoleBadge role={profile?.role} />
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  void handleAvatarSelect(file);
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  position: 'relative',
                  paddingRight: 88,
                }}
              >
                <button
                  type="button"
                  className="hof-btn hof-press"
                  aria-label="Change profile photo"
                  disabled={avatarUploading}
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    position: 'relative',
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    flexShrink: 0,
                    padding: 0,
                    overflow: 'hidden',
                    border: `2px solid ${colors.borderHi}`,
                    background: colors.elevated,
                  }}
                >
                  {avatarPreview || profile?.avatar_url ? (
                    <img
                      src={avatarPreview ?? profile?.avatar_url ?? ''}
                      alt={profile?.display_name ?? 'Profile photo'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
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
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: avatarUploading ? 'rgba(0,0,0,0.45)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 150ms',
                    }}
                  >
                    {avatarUploading ? (
                      <span
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 10,
                          fontWeight: 600,
                          color: colors.text,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Saving
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      right: 2,
                      bottom: 2,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: colors.bg,
                      border: `1px solid ${colors.borderHi}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                    }}
                  >
                    <Icon name="camera" size={12} color={colors.amber} />
                  </div>
                </button>
                <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                  <ProfileNameField
                    displayName={profile?.display_name ?? 'Member'}
                    editing={editingName}
                    onEditingChange={setEditingName}
                    saving={savingName}
                    onSave={saveDisplayName}
                  />
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: colors.textSec,
                      marginTop: 4,
                      lineHeight: 1.4,
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
                  {!editingName && (
                    <button
                      type="button"
                      className="hof-btn hof-press"
                      onClick={() => setEditingName(true)}
                      style={{
                        marginTop: 10,
                        padding: 0,
                        background: 'transparent',
                        fontFamily: 'Inter',
                        fontSize: 12,
                        fontWeight: 500,
                        color: colors.amber,
                      }}
                    >
                      Edit name
                    </button>
                  )}
                  {profileSaveError && (
                    <div
                      style={{
                        fontFamily: 'Inter',
                        fontSize: 11,
                        color: colors.error,
                        marginTop: 8,
                      }}
                    >
                      {profileSaveError}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: `1px solid ${colors.border}`,
                  position: 'relative',
                }}
              >
                {(
                  [
                    [String(profile?.editions_attended ?? 0), 'Themes', colors.amber],
                    [String(profile?.tickets_count ?? 0), 'Tickets', colors.gold],
                    ['—', 'Photos', colors.textSec],
                  ] as [string, string, string][]
                ).map(([n, l, accent]) => (
                  <div
                    key={l}
                    style={{
                      background: colors.elevated,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 10,
                      padding: '12px 10px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'Clash Display',
                        fontWeight: 600,
                        fontSize: 24,
                        color: accent,
                        letterSpacing: '-0.01em',
                        lineHeight: 1,
                      }}
                    >
                      {n}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Inter',
                        fontSize: 10,
                        color: colors.textSec,
                        marginTop: 6,
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

          {/* Tabs — COMMUNITY_FEATURE hides Posts tab */}
          {COMMUNITY_FEATURE_ENABLED ? (
            <div style={{ padding: '20px 0 0' }}>
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
              <div style={{ padding: '24px 0 0' }}>
                <ProfileSectionLabel accent>Upcoming ticket</ProfileSectionLabel>
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
                      borderRadius: 14,
                      overflow: 'hidden',
                      display: 'block',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
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
                <div style={{ padding: '24px 0 0' }}>
                  <ProfileSectionLabel accent>Referral</ProfileSectionLabel>
                  <div
                    style={{
                      position: 'relative',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 18,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: -40,
                        left: -20,
                        width: 160,
                        height: 160,
                        borderRadius: 80,
                        background:
                          'radial-gradient(circle, rgba(201,148,42,0.12), transparent 70%)',
                        pointerEvents: 'none',
                      }}
                    />
                    <div
                      style={{
                        fontFamily: 'Inter',
                        fontSize: 9,
                        color: colors.textSec,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        marginBottom: 8,
                        position: 'relative',
                      }}
                    >
                      Your code
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 12,
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono',
                          fontSize: 20,
                          fontWeight: 600,
                          color: colors.text,
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
                          padding: '6px 14px',
                          background: copiedCode ? 'rgba(232,101,26,0.12)' : colors.elevated,
                          border: `1px solid ${copiedCode ? colors.amber : colors.borderHi}`,
                          borderRadius: 8,
                          fontFamily: 'Inter',
                          fontSize: 12,
                          fontWeight: 600,
                          color: copiedCode ? colors.amber : colors.text,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {copiedCode ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginBottom: 12,
                        position: 'relative',
                      }}
                    >
                      {[
                        [`${referral.referral_count}`, 'Friends joined'],
                        [`${referral.conversions}`, 'Got tickets'],
                      ].map(([n, label]) => (
                        <div
                          key={label}
                          style={{
                            flex: 1,
                            background: colors.elevated,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            padding: '10px 12px',
                          }}
                        >
                          <div
                            style={{
                              fontFamily: 'Clash Display',
                              fontWeight: 600,
                              fontSize: 18,
                              color: colors.gold,
                              lineHeight: 1,
                            }}
                          >
                            {n}
                          </div>
                          <div
                            style={{
                              fontFamily: 'Inter',
                              fontSize: 10,
                              color: colors.textSec,
                              marginTop: 4,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Inter',
                        fontSize: 13,
                        color: colors.textSec,
                        lineHeight: 1.55,
                        position: 'relative',
                      }}
                    >
                      Share the fire — your friends skip the waitlist next theme.
                    </div>
                  </div>
                </div>
              )}

              {/* Ticket history */}
              <div style={{ padding: '28px 0 0' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 12,
                  }}
                >
                  <ProfileSectionLabel style={{ marginBottom: 0 }}>
                    Your tickets
                  </ProfileSectionLabel>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: colors.amber,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '0.02em',
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
              <div style={{ padding: '28px 0 0' }}>
                <ProfileSectionLabel>Account</ProfileSectionLabel>
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
                          clearProfileCache();
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
    </div>
  );
}
