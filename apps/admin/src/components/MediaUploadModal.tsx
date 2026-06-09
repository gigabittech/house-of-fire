'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { uploadEventPhotos, validateImageFile } from '@/lib/storageUpload';

export interface MediaUploadEventOption {
  id: string;
  edition_number: number;
  name: string;
}

interface MediaUploadModalProps {
  open: boolean;
  events: MediaUploadEventOption[];
  defaultEventId?: string;
  onClose: () => void;
  onUploaded: (eventId: string, result: { uploaded: number; failed: number }) => void;
}

interface PendingFile {
  id: string;
  file: File;
}

const MAX_FILES = 24;

const labelStyle: React.CSSProperties = {
  fontFamily: 'Inter, system-ui',
  fontSize: 10,
  color: 'var(--hof-text-sec)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 40,
  padding: '0 12px',
  background: 'var(--hof-elevated)',
  border: '1px solid var(--hof-border)',
  borderRadius: 8,
  fontFamily: 'Inter, system-ui',
  fontSize: 14,
  color: 'var(--hof-text)',
  outline: 'none',
};

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUploadModal({
  open,
  events,
  defaultEventId,
  onClose,
  onUploaded,
}: MediaUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [eventId, setEventId] = useState(defaultEventId ?? '');
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEventId(defaultEventId ?? events[0]?.id ?? '');
    setCaption('');
    setFiles([]);
    setError(null);
    setSubmitting(false);
    setUploadProgress(null);
  }, [open, defaultEventId, events]);

  useEffect(() => {
    const urls: Record<string, string> = {};
    for (const item of files) {
      urls[item.id] = URL.createObjectURL(item.file);
    }
    setPreviewUrls(urls);
    return () => {
      for (const url of Object.values(urls)) URL.revokeObjectURL(url);
    };
  }, [files]);

  if (!open) return null;

  const totalBytes = files.reduce((sum, item) => sum + item.file.size, 0);
  const atFileLimit = files.length >= MAX_FILES;

  function addFiles(picked: File[]) {
    if (picked.length === 0) return;

    const validationErrors: string[] = [];
    const toAdd: PendingFile[] = [];
    const existingIds = new Set(files.map((f) => f.id));

    for (const file of picked) {
      if (files.length + toAdd.length >= MAX_FILES) break;
      const err = validateImageFile(file);
      if (err) {
        validationErrors.push(`${file.name}: ${err}`);
        continue;
      }
      const id = fileKey(file);
      if (existingIds.has(id) || toAdd.some((f) => f.id === id)) continue;
      toAdd.push({ id, file });
    }

    if (toAdd.length > 0) {
      setFiles((prev) => [...prev, ...toAdd]);
      setError(null);
    }
    if (validationErrors.length > 0) {
      setError(validationErrors.join(' · '));
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function clearFiles() {
    setFiles([]);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId) {
      setError('Select an event');
      return;
    }
    if (files.length === 0) {
      setError('Add at least one photo');
      return;
    }

    setSubmitting(true);
    setError(null);
    setUploadProgress({ done: 0, total: files.length });

    try {
      const result = await uploadEventPhotos(
        eventId,
        files.map((f) => f.file),
        caption,
        (done, total) => setUploadProgress({ done, total }),
      );

      if (result.uploaded.length === 0) {
        const first = result.failed[0];
        throw new Error(first?.error ?? 'All uploads failed');
      }

      onUploaded(eventId, {
        uploaded: result.uploaded.length,
        failed: result.failed.length,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--hof-surface)',
          border: '1px solid var(--hof-border)',
          borderRadius: 14,
          color: 'var(--hof-text)',
          fontFamily: 'Inter, system-ui',
        }}
      >
        <div
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid var(--hof-border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'Inter, system-ui',
                fontSize: 10,
                color: 'var(--hof-text-sec)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              Media
            </div>
            <div
              style={{
                fontFamily: 'Clash Display, system-ui',
                fontWeight: 600,
                fontSize: 22,
                color: 'var(--hof-text)',
                letterSpacing: '-0.01em',
                marginTop: 4,
              }}
            >
              Upload photos
            </div>
            <div
              style={{
                fontFamily: 'Inter, system-ui',
                fontSize: 12,
                color: 'var(--hof-text-sec)',
                marginTop: 4,
              }}
            >
              {files.length === 0
                ? `Add up to ${MAX_FILES} images per batch`
                : `${files.length} selected · ${formatFileSize(totalBytes)} total`}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            disabled={submitting}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              border: '1px solid var(--hof-border)',
              background: 'var(--hof-elevated)',
              color: 'var(--hof-text-sec)',
              cursor: submitting ? 'wait' : 'pointer',
              fontSize: 18,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} style={{ padding: '18px 22px 22px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Event *</div>
            <select
              required
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              disabled={submitting}
              style={inputStyle}
            >
              <option value="" disabled>
                Select event…
              </option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  Th {ev.edition_number} · {ev.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <div style={{ ...labelStyle, marginBottom: 0 }}>Photos *</div>
              {files.length > 0 ? (
                <button
                  type="button"
                  onClick={clearFiles}
                  disabled={submitting}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    fontFamily: 'Inter, system-ui',
                    fontSize: 11,
                    color: 'var(--hof-text-sec)',
                    cursor: submitting ? 'wait' : 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Clear all
                </button>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []));
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />

            {files.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                style={{
                  width: '100%',
                  minHeight: 148,
                  padding: 20,
                  borderRadius: 10,
                  border: '1px dashed var(--hof-border)',
                  background: 'var(--hof-elevated)',
                  cursor: submitting ? 'wait' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    background: 'rgba(232,101,26,0.12)',
                    border: '1px solid rgba(232,101,26,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="image" size={20} color="var(--hof-amber)" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--hof-text)' }}>
                    Choose photos
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--hof-text-sec)', marginTop: 4 }}>
                    JPEG, PNG, WebP, HEIC · up to 50 MB each
                  </div>
                </div>
              </button>
            ) : (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid var(--hof-border)',
                  background: 'var(--hof-elevated)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                    gap: 8,
                  }}
                >
                  {files.map((item) => (
                    <div key={item.id} style={{ minWidth: 0 }}>
                      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                        <img
                          src={previewUrls[item.id]}
                          alt=""
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            objectFit: 'cover',
                            display: 'block',
                            background: 'var(--hof-bg)',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(item.id)}
                          disabled={submitting}
                          aria-label={`Remove ${item.file.name}`}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            border: 'none',
                            background: 'rgba(10,10,8,0.75)',
                            color: 'var(--hof-text)',
                            cursor: submitting ? 'wait' : 'pointer',
                            fontSize: 14,
                            lineHeight: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div
                        title={item.file.name}
                        style={{
                          marginTop: 4,
                          fontSize: 10,
                          color: 'var(--hof-text-dis)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.file.name}
                      </div>
                    </div>
                  ))}

                  {!atFileLimit ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={submitting}
                      style={{
                        aspectRatio: '1',
                        minHeight: 96,
                        borderRadius: 8,
                        border: '1px dashed var(--hof-border)',
                        background: 'var(--hof-bg)',
                        cursor: submitting ? 'wait' : 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        color: 'var(--hof-text-sec)',
                        fontFamily: 'Inter, system-ui',
                        fontSize: 11,
                      }}
                    >
                      <Icon name="image" size={16} color="var(--hof-text-sec)" />
                      Add more
                    </button>
                  ) : null}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <Pill tone="neutral" size="sm">
                    {files.length} / {MAX_FILES}
                  </Pill>
                  <span style={{ fontSize: 11, color: 'var(--hof-text-dis)' }}>
                    Shared caption applies to all photos in this batch
                  </span>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={labelStyle}>Caption (optional)</div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={submitting}
              rows={3}
              placeholder="Short description applied to every photo in this upload…"
              style={{
                ...inputStyle,
                height: 'auto',
                padding: '10px 12px',
                resize: 'vertical',
                minHeight: 72,
              }}
            />
          </div>

          {uploadProgress ? (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'var(--hof-text-sec)',
                  marginBottom: 6,
                }}
              >
                <span>Uploading photos…</span>
                <span>
                  {uploadProgress.done} / {uploadProgress.total}
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: 'var(--hof-border)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(uploadProgress.done / uploadProgress.total) * 100}%`,
                    background: 'var(--hof-amber)',
                    transition: 'width 150ms ease-out',
                  }}
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <div
              style={{
                marginBottom: 14,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(232,74,26,0.1)',
                border: '1px solid rgba(232,74,26,0.3)',
                fontSize: 13,
                color: 'var(--hof-error)',
                lineHeight: 1.45,
              }}
            >
              {error}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                height: 40,
                padding: '0 16px',
                borderRadius: 8,
                border: '1px solid var(--hof-border)',
                background: 'var(--hof-elevated)',
                color: 'var(--hof-text-sec)',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                fontWeight: 500,
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !eventId || files.length === 0}
              style={{
                height: 40,
                padding: '0 18px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--hof-amber)',
                color: 'var(--hof-bg)',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting || !eventId || files.length === 0 ? 'not-allowed' : 'pointer',
                opacity: submitting || !eventId || files.length === 0 ? 0.6 : 1,
              }}
            >
              {submitting
                ? 'Uploading…'
                : files.length <= 1
                  ? 'Upload photo'
                  : `Upload ${files.length} photos`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
