'use client';

import type { CSSProperties } from 'react';
import { colors } from '@hof/design-tokens';
import { Icon } from '@hof/ui';
import SheetShell from './SheetShell.js';

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
}

interface ShareRow {
  id: string;
  label: string;
  sub: string;
  icon: Parameters<typeof Icon>[0]['name'];
  accent: boolean;
}

const SHARE_ROWS: ShareRow[] = [
  { id: 'copy', label: 'Copy link', sub: 'houseoffire.events/e/24', icon: 'share', accent: false },
  { id: 'imsg', label: 'iMessage', sub: 'Open in Messages', icon: 'users', accent: false },
  { id: 'ig', label: 'Instagram stories', sub: 'Share to your story', icon: 'image', accent: false },
  { id: 'tw', label: 'Twitter / X', sub: 'Post the link', icon: 'music', accent: false },
  { id: 'invite', label: 'Copy invite code', sub: 'They get $5 off. You get a beer.', icon: 'ticket', accent: true },
];

function handleShare(id: string) {
  switch (id) {
    case 'copy':
      navigator.clipboard?.writeText(window.location.href).catch(console.error);
      break;
    case 'tw':
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent("House of Fire — I'm going! Get your tickets: houseoffire.events")}&url=${encodeURIComponent(window.location.href)}`,
      );
      break;
    case 'imsg':
    case 'ig':
    case 'invite':
      if (navigator.share) {
        navigator.share({ title: 'House of Fire', url: window.location.href }).catch(console.error);
      } else {
        navigator.clipboard?.writeText(window.location.href).catch(console.error);
      }
      break;
    default:
      navigator.clipboard?.writeText(window.location.href).catch(console.error);
  }
}

function ShareRowItem({ row }: { row: ShareRow }) {
  const rowStyle: CSSProperties = {
    width: '100%',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '12px 0',
    borderBottom: `1px solid ${colors.border}`,
    background: 'transparent',
  };

  return (
    <button className="hof-btn hof-press" style={rowStyle} onClick={() => handleShare(row.id)}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: row.accent ? colors.amber : colors.surface,
          border: `1px solid ${row.accent ? colors.amber : colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={row.icon} size={16} color={row.accent ? colors.bg : colors.text} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: colors.text }}>
          {row.label}
        </div>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 12,
            color: colors.textSec,
            marginTop: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.sub}
        </div>
      </div>
      <Icon name="chev" size={14} color={colors.textSec} />
    </button>
  );
}

export function ShareSheet({ open, onClose }: ShareSheetProps) {
  return (
    <SheetShell open={open} onClose={onClose} title="Tell a friend" sub="Share the fire.">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {SHARE_ROWS.map((row) => (
          <ShareRowItem key={row.id} row={row} />
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          padding: '14px 16px',
          background: 'rgba(232,101,26,0.08)',
          border: `1px solid rgba(232,101,26,0.25)`,
          borderRadius: 10,
        }}
      >
        <div
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 13,
            color: colors.amber,
            marginBottom: 4,
          }}
        >
          Tell people why you come.
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: colors.textSec, lineHeight: 1.5 }}>
          A personal note converts better than a bare link. Tell them what the room feels like.
        </div>
      </div>
    </SheetShell>
  );
}
