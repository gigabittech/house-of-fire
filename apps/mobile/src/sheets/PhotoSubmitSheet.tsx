'use client';

import { colors } from '@hof/design-tokens';
import { HofButton, Icon } from '@hof/ui';
import { useEffect, useRef, useState } from 'react';
import { uploadEventPhoto } from '../lib/storageUpload';
import SheetShell from './SheetShell';

interface PhotoSubmitSheetProps {
  open: boolean;
  onClose: () => void;
  eventId?: string;
  edition?: number;
}

type Stage = 'form' | 'sent';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'Inter',
        fontSize: 11,
        color: colors.textSec,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'Inter',
        fontSize: 12,
        color: colors.textSec,
        marginTop: 8,
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}

export default function PhotoSubmitSheet({
  open,
  onClose,
  eventId,
  edition = 23,
}: PhotoSubmitSheetProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [consent, setConsent] = useState(false);
  const [stage, setStage] = useState<Stage>('form');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedEventId, setResolvedEventId] = useState<string | undefined>(eventId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setStage('form');
      setCaption('');
      setConsent(false);
      setFiles([]);
      setError(null);
      setUploading(false);
    }
  }, [open]);

  useEffect(() => {
    setResolvedEventId(eventId);
    if (!open || eventId) return;
    fetch('/api/events/upcoming')
      .then((r) => r.json())
      .then((d: { event?: { id: string } }) => {
        if (d.event?.id) setResolvedEventId(d.event.id);
      })
      .catch(console.error);
  }, [open, eventId]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [files]);

  const valid = files.length > 0 && consent && Boolean(resolvedEventId);

  return (
    <SheetShell
      open={open}
      onClose={onClose}
      title={`Submit photos · Edition ${edition}`}
      sub="Crew reviews and posts the best to the recap."
    >
      {stage === 'form' && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              setFiles((prev) => [...prev, ...picked].slice(0, 5));
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
          <Label>Your photos ({files.length})</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {previewUrls.map((src, i) => (
              <div
                key={src}
                style={{
                  position: 'relative',
                  aspectRatio: '1/1',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#2a2826',
                }}
              >
                <img
                  src={src}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <button
                  className="hof-btn hof-press"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    background: 'rgba(10,10,8,0.8)',
                    backdropFilter: 'blur(6px)',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="close" size={10} color={colors.text} />
                </button>
              </div>
            ))}

            {files.length < 5 && (
              <button
                className="hof-btn hof-press"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  aspectRatio: '1/1',
                  borderRadius: 8,
                  background: colors.bg,
                  border: `1px dashed ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <Icon name="plus" size={20} color={colors.textSec} />
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 10,
                    color: colors.textSec,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                  }}
                >
                  Add
                </span>
              </button>
            )}
          </div>
          <Helper>
            Up to 5 per submission. JPG / HEIC / PNG. Faces of strangers will be blurred unless
            they&apos;re members who opted in.
          </Helper>

          <div style={{ height: 14 }} />
          <Label>Caption (optional)</Label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. peak moment, second drop"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: 46,
              padding: '0 14px',
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              fontFamily: 'Inter',
              fontSize: 14,
              color: colors.text,
              outline: 'none',
            }}
          />

          <button
            className="hof-btn hof-press"
            onClick={() => setConsent((c) => !c)}
            style={{
              width: '100%',
              marginTop: 18,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              background: consent ? colors.elevated : colors.bg,
              border: consent ? `1px solid ${colors.amber}` : `1px solid ${colors.border}`,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                flexShrink: 0,
                background: consent ? colors.amber : 'transparent',
                border: `1.5px solid ${consent ? colors.amber : colors.borderHi}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {consent && <Icon name="check" size={12} color={colors.bg} />}
            </div>
            <div
              style={{
                flex: 1,
                fontFamily: 'Inter',
                fontSize: 13,
                color: colors.text,
                lineHeight: 1.45,
              }}
            >
              I took these or have permission to share them. Approved photos may appear in the recap
              and on the home archive.
            </div>
          </button>

          {error && (
            <div
              style={{
                marginTop: 12,
                fontFamily: 'Inter',
                fontSize: 13,
                color: colors.error,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <HofButton
              variant="primary"
              full
              disabled={!valid || uploading}
              onClick={async () => {
                if (!valid || !resolvedEventId) return;
                setUploading(true);
                setError(null);
                try {
                  for (const file of files) {
                    await uploadEventPhoto(resolvedEventId, file);
                  }
                  setStage('sent');
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Upload failed');
                } finally {
                  setUploading(false);
                }
              }}
            >
              {uploading
                ? 'Uploading…'
                : valid
                  ? `Submit ${files.length} photo${files.length === 1 ? '' : 's'}`
                  : 'Confirm consent'}
            </HofButton>
          </div>
        </>
      )}

      {stage === 'sent' && (
        <>
          <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 16px',
                borderRadius: 32,
                background: 'rgba(76,175,110,0.15)',
                border: `2px solid ${colors.success}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="camera" size={28} color={colors.success} />
            </div>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 22,
                color: colors.text,
              }}
            >
              In the review queue
            </div>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: colors.textSec,
                marginTop: 8,
                lineHeight: 1.5,
                maxWidth: 260,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Crew reviews within a couple days. We&apos;ll notify you when they&apos;re up.
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <HofButton variant="primary" full onClick={onClose}>
              Done
            </HofButton>
          </div>
        </>
      )}
    </SheetShell>
  );
}
