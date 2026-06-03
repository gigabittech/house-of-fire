'use client';

import { colors } from '@hof/design-tokens';
import { Avatar, Icon } from '@hof/ui';
import { type CSSProperties, useEffect, useState } from 'react';
import { CHANNELS } from '../data/posts';
import { useSheet } from './useSheet';

interface ComposerSheetProps {
  open: boolean;
  onClose: () => void;
  defaultChannel?: string;
  onPost?: (channel: string, title: string, body?: string) => Promise<void>;
  eventId?: string;
}

const CHAR_LIMIT = 500;

export default function ComposerSheet({
  open,
  onClose,
  defaultChannel = 'general',
  onPost,
}: ComposerSheetProps) {
  const { mounted, shown } = useSheet(open);
  const [channel, setChannel] = useState(defaultChannel);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hasPhotos, setHasPhotos] = useState(false);
  const [anon, setAnon] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (open) setChannel(defaultChannel);
  }, [open, defaultChannel]);

  if (!mounted) return null;

  const canPost = body.trim().length > 0;

  const scrim: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 80,
    background: 'rgba(0,0,0,0.55)',
    opacity: shown ? 1 : 0,
    transition: 'opacity 200ms ease-out',
  };
  const sheet: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    background: colors.surface,
    borderTop: `1px solid ${colors.border}`,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    transform: shown ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 240ms cubic-bezier(0.22, 0.84, 0.36, 1)',
    boxShadow: '0 -24px 60px rgba(0,0,0,0.55)',
    maxHeight: '85%',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <>
      <div style={scrim} onClick={onClose} />
      <div style={sheet}>
        {/* Grabber */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: colors.border,
            margin: '12px auto 6px',
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: '6px 16px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <button
            className="hof-btn"
            onClick={onClose}
            style={{
              fontFamily: 'Inter',
              fontSize: 13,
              color: colors.textSec,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: colors.text }}>
            New post
          </div>
          <button
            disabled={!canPost || posting}
            className="hof-btn hof-press"
            onClick={async () => {
              if (!title.trim() && !body.trim()) return;
              setPosting(true);
              await onPost?.(channel, title, body || undefined);
              setPosting(false);
              setTitle('');
              setBody('');
              onClose();
            }}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: canPost ? colors.amber : colors.elevated,
              border: `1px solid ${canPost ? colors.amber : colors.border}`,
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: 13,
              color: canPost ? colors.bg : colors.textDis,
              opacity: canPost ? 1 : 0.6,
            }}
          >
            {posting ? '…' : 'Post'}
          </button>
        </div>

        {/* Body */}
        <div
          className="hof-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 24px' }}
        >
          {/* Channel picker */}
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 10,
              color: colors.textSec,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Posting to
          </div>
          <div
            className="hof-scroll"
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 6,
              margin: '0 -16px',
              paddingLeft: 16,
              paddingRight: 16,
            }}
          >
            {CHANNELS.map((c) => {
              if (c.locked) return null;
              const active = channel === c.id;
              return (
                <button
                  key={c.id}
                  className="hof-btn hof-press"
                  onClick={() => setChannel(c.id)}
                  style={{
                    flexShrink: 0,
                    padding: '7px 12px',
                    background: active ? colors.amber : colors.elevated,
                    border: `1px solid ${active ? colors.amber : colors.border}`,
                    borderRadius: 6,
                    fontFamily: 'JetBrains Mono',
                    fontSize: 12,
                    color: active ? colors.bg : colors.text,
                    fontWeight: 500,
                  }}
                >
                  #{c.name}
                </button>
              );
            })}
          </div>

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              marginTop: 16,
              height: 44,
              padding: '0 4px',
              background: 'transparent',
              border: 0,
              borderBottom: `1px solid ${colors.border}`,
              fontFamily: 'Clash Display',
              fontWeight: 600,
              fontSize: 20,
              color: colors.text,
              outline: 'none',
              letterSpacing: '-0.01em',
            }}
          />

          {/* Body */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, CHAR_LIMIT))}
            placeholder={`Say something to #${channel}…`}
            rows={6}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              marginTop: 8,
              padding: '8px 4px',
              resize: 'none',
              background: 'transparent',
              border: 0,
              fontFamily: 'Inter',
              fontSize: 15,
              color: colors.text,
              outline: 'none',
              lineHeight: 1.5,
            }}
          />

          {/* Photo attach */}
          <div style={{ marginTop: 8 }}>
            {!hasPhotos ? (
              <button
                className="hof-btn hof-press"
                onClick={() => setHasPhotos(true)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: colors.bg,
                  border: `1px dashed ${colors.border}`,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: colors.textSec,
                }}
              >
                <Icon name="image" size={16} color={colors.textSec} />
                Attach photos
              </button>
            ) : (
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 4,
                    height: 120,
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  {([0, 1, 2] as const).map((seed) => (
                    <div
                      key={seed}
                      style={{
                        background: colors.elevated,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="image" size={20} color={colors.textDis} />
                    </div>
                  ))}
                </div>
                <button
                  className="hof-btn hof-press"
                  onClick={() => setHasPhotos(false)}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    background: 'rgba(10,10,8,0.8)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <Icon name="close" size={11} color={colors.text} />
                </button>
              </div>
            )}
          </div>

          {/* Bottom toolbar */}
          <div
            style={{
              marginTop: 16,
              padding: '12px 14px',
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              className="hof-btn hof-press"
              onClick={() => setAnon(!anon)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'Inter',
                fontSize: 13,
                color: colors.text,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: anon ? colors.amber : 'transparent',
                  border: `1.5px solid ${anon ? colors.amber : colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {anon && <Icon name="check" size={12} color={colors.bg} />}
              </div>
              Post anonymously
            </button>
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 11,
                color: body.length > CHAR_LIMIT * 0.85 ? colors.warning : colors.textSec,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {body.length} / {CHAR_LIMIT}
            </span>
          </div>

          {/* Posting as */}
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'Inter',
              fontSize: 11,
              color: colors.textSec,
            }}
          >
            <Avatar initials={anon ? '?' : 'SB'} userRole="member" size={20} />
            Posting as{' '}
            <span style={{ color: colors.text, fontWeight: 500 }}>
              {anon ? 'Anonymous member' : 'Sujan Bhuiyan'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
