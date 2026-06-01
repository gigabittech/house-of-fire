'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { colors } from '@hof/design-tokens';
import { Icon, Avatar } from '@hof/ui';
import { useSheet } from './useSheet.js';

interface NotifItem {
  kind: 'reply' | 'react' | 'crew' | 'mention' | 'photo';
  read: boolean;
  initials: string;
  name: string;
  action: string;
  target: string;
  time: string;
  postId?: string;
  highlight?: boolean;
}

const FALLBACK_NOTIFS: NotifItem[] = [
  { kind: 'reply',   read: false, initials: 'DP', name: 'Devon',
    action: 'replied to your post', target: 'how strict is no-phones-on-the-floor?', time: '8m', postId: 'p6' },
  { kind: 'react',   read: false, initials: 'JG', name: 'Jordan',
    action: 'reacted 🔥 to your post', target: 'how strict is no-phones-on-the-floor?', time: '24m', postId: 'p6' },
  { kind: 'crew',    read: false, initials: 'JG', name: 'Jordan',
    action: 'posted in #general', target: 'Edition 24 lineup is final', time: '2h', postId: 'p1', highlight: true },
  { kind: 'mention', read: true,  initials: 'IW', name: 'iris.w',
    action: 'mentioned you', target: '@nightowl will you be there Friday?', time: '1d' },
  { kind: 'photo',   read: true,  initials: 'CR', name: 'Crew',
    action: 'approved your photo for the recap', target: 'Edition 23 · Photo #082', time: '3d' },
  { kind: 'react',   read: true,  initials: 'TR', name: 'Tara',
    action: 'and 11 others reacted to your reply', target: 'Photo #047 has me crying.', time: '4d' },
];

const ICON_MAP: Record<NotifItem['kind'], Parameters<typeof Icon>[0]['name']> = {
  reply:   'chat',
  react:   'flame',
  crew:    'bell',
  mention: 'user',
  photo:   'image',
};

interface NotificationsSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenPost?: (id: string) => void;
}

function NotifRow({ n, onOpenPost }: { n: NotifItem; onOpenPost?: (id: string) => void }) {
  const iconName = ICON_MAP[n.kind];
  const isCrew   = n.kind === 'crew' || n.name === 'Jordan' || n.name === 'Crew';

  return (
    <button
      className="hof-btn hof-press"
      onClick={() => { if (n.postId && onOpenPost) onOpenPost(n.postId); }}
      style={{
        width: '100%', textAlign: 'left',
        display: 'flex', gap: 12, padding: '12px 16px',
        background: n.read ? 'transparent' : 'rgba(232,101,26,0.04)',
        borderBottom: `1px solid ${colors.border}`,
        alignItems: 'center',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar initials={n.initials} userRole={isCrew ? 'crew' : 'member'} size={36} />
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 18, height: 18, borderRadius: 9,
          background: n.highlight ? colors.amber : colors.surface,
          border: `2px solid ${colors.bg}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={iconName} size={10} color={n.highlight ? colors.bg : colors.textSec} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 13, color: colors.text, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 500 }}>{n.name}</span>{' '}
          <span style={{ color: colors.textSec }}>{n.action}</span>
        </div>
        <div style={{
          fontFamily: 'Inter', fontSize: 12, color: colors.textSec, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontStyle: (n.kind === 'reply' || n.kind === 'mention') ? 'italic' : 'normal',
        }}>"{n.target}"</div>
        <div style={{
          fontFamily: 'JetBrains Mono', fontSize: 10, color: colors.textDis, marginTop: 3,
        }}>{n.time} ago</div>
      </div>
      {!n.read && (
        <div style={{ width: 8, height: 8, borderRadius: 4, background: colors.amber, flexShrink: 0 }} />
      )}
    </button>
  );
}

function NotifGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{
        padding: '0 16px 8px',
        fontFamily: 'Inter', fontSize: 10, color: colors.textSec,
        letterSpacing: '0.22em', textTransform: 'uppercase',
      }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

type ApiNotif = {
  id: string;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  post_id?: string;
};

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function apiNotifToItem(n: ApiNotif): NotifItem {
  const validKinds: NotifItem['kind'][] = ['reply', 'react', 'crew', 'mention', 'photo'];
  const kind: NotifItem['kind'] = validKinds.includes(n.kind as NotifItem['kind'])
    ? (n.kind as NotifItem['kind'])
    : 'react';
  const initials = n.title.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase() || '?';
  return {
    kind,
    read: n.read,
    initials,
    name: n.title,
    action: '',
    target: n.body,
    time: timeAgo(n.created_at),
    postId: n.post_id,
    highlight: kind === 'crew',
  };
}

export default function NotificationsSheet({ open, onClose, onOpenPost }: NotificationsSheetProps) {
  const { mounted, shown } = useSheet(open);
  const [notifs, setNotifs] = useState<NotifItem[]>(FALLBACK_NOTIFS);

  useEffect(() => {
    if (!open) return;
    fetch('/api/notifications')
      .then(r => r.json())
      .then((d: { notifications?: ApiNotif[] }) => {
        if (d.notifications && d.notifications.length > 0) {
          setNotifs(d.notifications.map(apiNotifToItem));
        }
      })
      .catch(console.error);
  }, [open]);

  if (!mounted) return null;

  const overlay: CSSProperties = {
    position: 'absolute', inset: 0, zIndex: 100,
    background: colors.bg,
    transform: shown ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 260ms cubic-bezier(0.22, 0.84, 0.36, 1)',
    display: 'flex', flexDirection: 'column',
  };

  const FILTERS = ['All', 'Replies', 'Reactions', 'Crew'] as const;

  return (
    <div style={overlay}>
      {/* Status-bar spacer */}
      <div style={{ height: 54 }} />

      {/* Header */}
      <div style={{
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: colors.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Inbox</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
            color: colors.text, letterSpacing: '-0.01em', marginTop: 2,
          }}>Notifications</div>
        </div>
        <button
          className="hof-btn hof-press" onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: 18,
            background: colors.surface, border: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="close" size={16} color={colors.text} />
        </button>
      </div>

      <div className="hof-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Filter row */}
        <div style={{ padding: '12px 16px 0', display: 'flex', gap: 6 }}>
          {FILTERS.map((f, i) => (
            <button key={f} className="hof-btn hof-press" style={{
              padding: '6px 12px', borderRadius: 6,
              background: i === 0 ? colors.elevated : 'transparent',
              border: `1px solid ${i === 0 ? colors.border : 'transparent'}`,
              fontFamily: 'Inter', fontSize: 12,
              color: i === 0 ? colors.text : colors.textSec,
              fontWeight: 500,
            }}>{f}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            className="hof-btn"
            onClick={async () => {
              await fetch('/api/notifications/read-all', { method: 'PATCH' }).catch(console.error);
              setNotifs(prev => prev.map(n => ({ ...n, read: true })));
            }}
            style={{
              fontFamily: 'Inter', fontSize: 12, color: colors.amber, fontWeight: 500,
            }}
          >Mark all read</button>
        </div>

        <NotifGroup label="Today">
          {notifs.slice(0, 3).map((n, i) => (
            <NotifRow key={i} n={n} onOpenPost={onOpenPost} />
          ))}
        </NotifGroup>
        <NotifGroup label="Earlier this week">
          {notifs.slice(3).map((n, i) => (
            <NotifRow key={i} n={n} onOpenPost={onOpenPost} />
          ))}
        </NotifGroup>

        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}
