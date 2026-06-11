'use client';

import { colors } from '@hof/design-tokens';
import { Avatar, Icon } from '@hof/ui';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { CHANNELS } from '../data/posts';
import { uploadPostMediaBatch } from '../lib/storageUpload';
import { APP_OVERLAY_Z, appOverlayFixed } from './overlay';
import { useSheet } from './useSheet';

interface ComposerSheetProps {
  open: boolean;
  onClose: () => void;
  defaultChannel?: string;
  onPost?: (
    channel: string,
    title: string,
    body?: string,
    mediaUrls?: string[],
    isAnonymous?: boolean,
  ) => Promise<void>;
  eventId?: string;
}

const CHAR_LIMIT = 500;
const PREVIEW_MAX_HEIGHT = 220;

function previewLayout(count: number): CSSProperties {
  if (count <= 1) {
    return { display: 'block' };
  }
  if (count === 2) {
    return { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 };
  }
  return { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 };
}

function ComposerImagePreview({ src, single }: { src: string; single: boolean }) {
  if (single) {
    return (
      <div
        style={{
          width: '100%',
          borderRadius: 10,
          overflow: 'hidden',
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={src}
          alt=""
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            maxHeight: PREVIEW_MAX_HEIGHT,
            objectFit: 'contain',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        aspectRatio: '1',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}

export default function ComposerSheet({
  open,
  onClose,
  defaultChannel = 'general',
  onPost,
}: ComposerSheetProps) {
  const user = useAuthUser();
  const { mounted, shown } = useSheet(open);
  const [channel, setChannel] = useState(defaultChannel);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [anon, setAnon] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setChannel(defaultChannel);
    } else {
      setFiles([]);
      setUploadError(null);
    }
  }, [open, defaultChannel]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [files]);

  if (!mounted) return null;

  const canPost = body.trim().length > 0;

  const scrim: CSSProperties = {
    ...appOverlayFixed(),
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    opacity: shown ? 1 : 0,
    transition: 'opacity 200ms ease-out',
    pointerEvents: shown ? 'auto' : 'none',
  };
  const sheet: CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: APP_OVERLAY_Z + 1,
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
              setUploadError(null);
              try {
                const mediaUrls = files.length > 0 ? await uploadPostMediaBatch(files) : undefined;
                await onPost?.(channel, title, body || undefined, mediaUrls, anon);
                setTitle('');
                setBody('');
                setFiles([]);
                onClose();
              } catch (e) {
                setUploadError(e instanceof Error ? e.message : 'Upload failed');
              } finally {
                setPosting(false);
              }
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              setFiles((prev) => [...prev, ...picked].slice(0, 3));
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
          <div style={{ marginTop: 8 }}>
            {files.length === 0 ? (
              <button
                className="hof-btn hof-press"
                onClick={() => fileInputRef.current?.click()}
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
                <div style={previewLayout(previewUrls.length)}>
                  {previewUrls.map((src) => (
                    <ComposerImagePreview key={src} src={src} single={previewUrls.length === 1} />
                  ))}
                </div>
                <button
                  className="hof-btn hof-press"
                  onClick={() => setFiles([])}
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
            {uploadError && (
              <div
                style={{
                  marginTop: 8,
                  fontFamily: 'Inter',
                  fontSize: 12,
                  color: colors.error,
                }}
              >
                {uploadError}
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
            <Avatar
              initials={
                anon
                  ? '?'
                  : (user?.name ?? 'M')
                      .split(' ')
                      .map((p) => p[0] ?? '')
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
              }
              userRole="member"
              src={anon ? undefined : user?.avatarUrl}
              alt={user?.name}
              size={20}
            />
            Posting as{' '}
            <span style={{ color: colors.text, fontWeight: 500 }}>
              {anon ? 'Anonymous member' : (user?.name ?? 'Member')}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
