'use client';

import { colors } from '@hof/design-tokens';
import { Avatar, EmptyState, Icon } from '@hof/ui';
import { type CSSProperties, useCallback, useEffect, useState } from 'react';
import { useNotificationsRealtime } from '@/hooks/useNotificationsRealtime';
import { useSupabaseUserId } from '@/hooks/useSupabaseUserId';
import { useSheet } from './useSheet';

import { apiNotifToItem, type ApiNotif, type NotifItem } from '../lib/notificationUi';

const ICON_MAP: Record<NotifItem['kind'], Parameters<typeof Icon>[0]['name']> = {
  reply: 'chat',
  react: 'flame',
  crew: 'bell',
  mention: 'user',
  photo: 'image',
  moderation: 'check',
};

interface NotificationsSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenPost?: (id: string) => void;
}

function NotifRow({ n, onOpenPost }: { n: NotifItem; onOpenPost?: (id: string) => void }) {
  const iconName = ICON_MAP[n.kind];
  const isCrew = n.kind === 'crew';

  return (
    <button
      className="hof-btn hof-press"
      onClick={() => {
        if (n.postId && onOpenPost) onOpenPost(n.postId);
      }}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        background: n.read ? 'transparent' : 'rgba(232,101,26,0.04)',
        borderBottom: `1px solid ${colors.border}`,
        alignItems: 'center',
        cursor: n.postId ? 'pointer' : 'default',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar initials={n.initials} userRole={isCrew ? 'crew' : 'member'} size={36} />
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 18,
            height: 18,
            borderRadius: 9,
            background: n.highlight ? colors.amber : colors.surface,
            border: `2px solid ${colors.bg}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={iconName} size={10} color={n.highlight ? colors.bg : colors.textSec} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 13, color: colors.text, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 500 }}>{n.name}</span>{' '}
          <span style={{ color: colors.textSec }}>{n.action}</span>
        </div>
        {n.target && (
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              color: colors.textSec,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontStyle: n.kind === 'reply' || n.kind === 'mention' ? 'italic' : 'normal',
            }}
          >
            "{n.target}"
          </div>
        )}
        <div
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 10,
            color: colors.textDis,
            marginTop: 3,
          }}
        >
          {n.time} ago
        </div>
      </div>
      {!n.read && (
        <div
          style={{ width: 8, height: 8, borderRadius: 4, background: colors.amber, flexShrink: 0 }}
        />
      )}
    </button>
  );
}

function NotifGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          padding: '0 16px 8px',
          fontFamily: 'Inter',
          fontSize: 10,
          color: colors.textSec,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

const NOTIF_FILTERS = ['All', 'Replies', 'Reactions', 'Moderation', 'Crew'] as const;
type NotifFilter = (typeof NOTIF_FILTERS)[number];

export default function NotificationsSheet({ open, onClose, onOpenPost }: NotificationsSheetProps) {
  const { mounted, shown } = useSheet(open);
  const userId = useSupabaseUserId();
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [filter, setFilter] = useState<NotifFilter>('All');
  const [loaded, setLoaded] = useState(false);

  const loadNotifs = useCallback(() => {
    setLoaded(false);
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d: { notifications?: ApiNotif[] }) => {
        setNotifs((d.notifications ?? []).map(apiNotifToItem));
      })
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!open) return;
    loadNotifs();
  }, [open, loadNotifs]);

  useNotificationsRealtime({
    userId,
    enabled: open && Boolean(userId),
    onNotification: () => loadNotifs(),
  });

  if (!mounted) return null;

  const visible = notifs.filter((n) => {
    if (filter === 'All') return true;
    if (filter === 'Replies') return n.kind === 'reply' || n.kind === 'mention';
    if (filter === 'Reactions') return n.kind === 'react';
    if (filter === 'Moderation') return n.kind === 'moderation';
    if (filter === 'Crew') return n.kind === 'crew';
    return true;
  });

  const overlay: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 100,
    background: colors.bg,
    transform: shown ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 260ms cubic-bezier(0.22, 0.84, 0.36, 1)',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={overlay}>
      <div style={{ height: 54 }} />

      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${colors.border}`,
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
            Inbox
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
            Notifications
          </div>
        </div>
        <button
          className="hof-btn hof-press"
          onClick={onClose}
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
          <Icon name="close" size={16} color={colors.text} />
        </button>
      </div>

      <div className="hof-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '12px 16px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {NOTIF_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className="hof-btn hof-press"
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: f === filter ? colors.elevated : 'transparent',
                border: `1px solid ${f === filter ? colors.border : 'transparent'}`,
                fontFamily: 'Inter',
                fontSize: 12,
                color: f === filter ? colors.text : colors.textSec,
                fontWeight: 500,
              }}
            >
              {f}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            className="hof-btn"
            onClick={async () => {
              await fetch('/api/notifications/read-all', { method: 'PATCH' }).catch(console.error);
              setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              color: colors.amber,
              fontWeight: 500,
            }}
          >
            Mark all read
          </button>
        </div>

        {loaded && visible.length === 0 ? (
          <div style={{ padding: '32px 16px' }}>
            <EmptyState icon="bell" title="All caught up" body="No notifications in this filter." />
          </div>
        ) : (
          <>
            <NotifGroup label="Recent">
              {visible.map((n, i) => (
                <NotifRow key={`${n.name}-${n.time}-${i}`} n={n} onOpenPost={onOpenPost} />
              ))}
            </NotifGroup>
          </>
        )}

        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}
