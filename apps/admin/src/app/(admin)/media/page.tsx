'use client';

import { HofToast, ImageLightbox, type ToastKind } from '@hof/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { MediaUploadModal } from '@/components/MediaUploadModal';
import { PaneHeader } from '@/components/PaneHeader';
import { Pill } from '@/components/Pill';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@/components/TablePagination';

type PhotoStatus = 'pending' | 'approved' | 'rejected' | 'inactive';
type StatusFilter = 'all' | PhotoStatus;

interface EventOption {
  id: string;
  edition_number: number;
  name: string;
}

interface PhotoApiRow {
  id: string;
  event_id: string;
  storage_path: string;
  public_url: string | null;
  caption: string | null;
  status: PhotoStatus;
  created_at: string;
  uploader_email: string | null;
  events: { edition_number: number; name: string } | null;
  profiles: { id: string; handle: string; display_name: string; avatar_url: string | null } | null;
}

interface PhotoItem {
  id: string;
  eventId: string;
  fileName: string;
  caption: string | null;
  displayName: string;
  handle: string;
  email: string | null;
  eventLabel: string;
  eventName: string;
  status: PhotoStatus;
  publicUrl: string | null;
  createdAt: string;
}

interface ToastState {
  kind: ToastKind;
  message: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'pending', label: 'Pending' },
];

const TABLE_COLUMNS = '56px 1.5fr 1fr 1fr 120px 88px minmax(220px, 1.5fr)';
const TABLE_MIN_WIDTH = 1020;

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

const approveBtn: React.CSSProperties = {
  height: 30,
  padding: '0 12px',
  background: 'var(--hof-success)',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--hof-bg)',
  whiteSpace: 'nowrap',
};

const ghostBtn: React.CSSProperties = {
  height: 30,
  padding: '0 12px',
  background: 'var(--hof-elevated)',
  border: '1px solid var(--hof-border)',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--hof-text-sec)',
  whiteSpace: 'nowrap',
};

const dangerBtn: React.CSSProperties = {
  height: 30,
  padding: '0 12px',
  background: 'rgba(232,74,26,0.12)',
  border: '1px solid rgba(232,74,26,0.35)',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--hof-error)',
  whiteSpace: 'nowrap',
};

const warnBtn: React.CSSProperties = {
  height: 30,
  padding: '0 12px',
  background: 'rgba(232,162,26,0.12)',
  border: '1px solid rgba(232,162,26,0.35)',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--hof-warning)',
  whiteSpace: 'nowrap',
};

const ellipsis: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function statusTone(status: PhotoStatus): Parameters<typeof Pill>[0]['tone'] {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'inactive') return 'muted';
  return 'warning';
}

function actionBtnStyle(base: React.CSSProperties, busy: boolean): React.CSSProperties {
  return {
    ...base,
    opacity: busy ? 0.6 : 1,
    cursor: busy ? 'wait' : 'pointer',
  };
}

function fileNameFromPath(storagePath: string): string {
  const segment = storagePath.split('/').pop();
  return segment ?? storagePath;
}

function mapPhotoRow(row: PhotoApiRow): PhotoItem {
  const edition = row.events?.edition_number;
  return {
    id: row.id,
    eventId: row.event_id,
    fileName: fileNameFromPath(row.storage_path),
    caption: row.caption,
    displayName: row.profiles?.display_name ?? 'Unknown',
    handle: row.profiles?.handle ?? 'unknown',
    email: row.uploader_email,
    eventLabel: edition != null ? `Th ${edition}` : 'Th ?',
    eventName: row.events?.name ?? 'Unknown event',
    status: row.status,
    publicUrl: row.public_url,
    createdAt: row.created_at,
  };
}

function TableHeader() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: TABLE_COLUMNS,
        gap: 12,
        padding: '12px 18px',
        borderBottom: '1px solid var(--hof-border)',
        fontFamily: 'Inter, system-ui',
        fontSize: 10,
        color: 'var(--hof-text-sec)',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        alignItems: 'center',
        minWidth: TABLE_MIN_WIDTH,
      }}
    >
      <div>Preview</div>
      <div>Uploader</div>
      <div>File</div>
      <div>Event</div>
      <div>Uploaded</div>
      <div>Status</div>
      <div style={{ textAlign: 'right' }}>Actions</div>
    </div>
  );
}

function EllipsisText({
  children,
  title,
  style,
}: {
  children: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
}) {
  const text = typeof children === 'string' ? children : title;
  return (
    <div title={title ?? text} style={{ ...ellipsis, ...style }}>
      {children}
    </div>
  );
}

function PhotoThumb({
  url,
  onPreview,
}: {
  url: string | null;
  onPreview: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPreview}
      disabled={!url}
      aria-label="Preview photo"
      style={{
        padding: 0,
        border: '1px solid var(--hof-border)',
        borderRadius: 6,
        overflow: 'hidden',
        cursor: url ? 'zoom-in' : 'default',
        background: 'var(--hof-elevated)',
        width: 48,
        height: 48,
        flexShrink: 0,
        opacity: url ? 1 : 0.6,
      }}
    >
      {url ? (
        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="image" size={16} color="var(--hof-text-dis)" />
        </div>
      )}
    </button>
  );
}

export default function MediaPage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [eventId, setEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set('status', statusFilter);
    sp.set('page', String(pagination.page));
    sp.set('limit', String(pagination.limit));
    if (eventId) sp.set('eventId', eventId);
    return sp.toString();
  }, [statusFilter, eventId, pagination.page, pagination.limit]);

  const showToast = useCallback((kind: ToastKind, message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/media?${queryString}`);
      const data = (await res.json()) as {
        photos?: PhotoApiRow[];
        pagination?: Pagination;
        error?: string;
      };
      if (data.error) {
        setError(data.error);
        setPhotos([]);
      } else {
        const rows = data.photos ?? [];
        const nextPagination = data.pagination;
        if (
          rows.length === 0 &&
          nextPagination &&
          nextPagination.total > 0 &&
          nextPagination.page > 1
        ) {
          setPagination((p) => ({ ...p, page: p.page - 1 }));
          return;
        }
        setPhotos(rows.map(mapPhotoRow));
        if (nextPagination) setPagination(nextPagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  const refreshPendingCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/nav-counts');
      const data = (await res.json()) as { mediaPending?: number };
      setPendingTotal(data.mediaPending ?? 0);
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [eventsRes, countsRes] = await Promise.all([
          fetch('/api/admin/events'),
          fetch('/api/admin/nav-counts'),
        ]);
        const eventsData = (await eventsRes.json()) as { events?: EventOption[]; error?: string };
        if (!eventsData.error && eventsData.events) {
          setEvents(eventsData.events);
        }
        const countsData = (await countsRes.json()) as { mediaPending?: number };
        setPendingTotal(countsData.mediaPending ?? 0);
      } catch {
        // non-blocking
      }
    }
    void loadMeta();
  }, []);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  async function updatePhotoStatus(id: string, status: PhotoStatus) {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? 'Action failed');
      }
      const messages: Record<PhotoStatus, string> = {
        approved: 'Photo approved',
        rejected: 'Photo rejected',
        inactive: 'Photo deactivated',
        pending: 'Photo moved to pending',
      };
      showToast('success', messages[status]);
      void refreshPendingCount();
      void loadPhotos();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  async function deletePhoto(id: string, fileName: string) {
    if (
      !window.confirm(
        `Permanently delete "${fileName}"?\n\nThis removes the file from storage and cannot be undone.`,
      )
    ) {
      return;
    }

    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? 'Delete failed');
      }
      showToast('success', 'Photo permanently deleted');
      void refreshPendingCount();
      void loadPhotos();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  function handleUploaded(
    uploadedEventId: string,
    result: { uploaded: number; failed: number },
  ) {
    setEventId(uploadedEventId);
    setStatusFilter('all');
    setPagination((p) => ({ ...p, page: 1 }));
    if (result.failed > 0) {
      showToast(
        'warn',
        `${result.uploaded} photo${result.uploaded === 1 ? '' : 's'} uploaded · ${result.failed} failed`,
      );
    } else {
      showToast(
        'success',
        result.uploaded === 1
          ? 'Photo uploaded successfully'
          : `${result.uploaded} photos uploaded successfully`,
      );
    }
    void loadPhotos();
    void refreshPendingCount();
  }

  const headerSub = loading
    ? 'Loading…'
    : statusFilter === 'pending'
      ? `${pagination.total} pending`
      : `${pagination.total} photo${pagination.total === 1 ? '' : 's'}`;

  return (
    <>
      <PaneHeader
        eyebrow="Media"
        title="Photo review"
        sub={headerSub}
        cta={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Pill tone="warning" size="sm">
              {loading ? '…' : `${pendingTotal} pending`}
            </Pill>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              style={{
                height: 40,
                padding: '0 14px',
                borderRadius: 8,
                background: 'var(--hof-amber)',
                border: 'none',
                color: 'var(--hof-bg)',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name="image" size={14} color="var(--hof-bg)" />
              Upload photos
            </button>
          </div>
        }
      />

      <div style={{ padding: '20px 28px 28px' }}>
        <div
          style={{
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'Inter, system-ui',
                  fontSize: 10,
                  color: 'var(--hof-text-sec)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Event
              </div>
              <select
                value={eventId}
                onChange={(e) => {
                  setPagination((p) => ({ ...p, page: 1 }));
                  setEventId(e.target.value);
                }}
                style={inputStyle}
              >
                <option value="">All events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    Th {ev.edition_number} · {ev.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: '2 1 280px', minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'Inter, system-ui',
                  fontSize: 10,
                  color: 'var(--hof-text-sec)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Status
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {STATUS_FILTERS.map((f) => {
                  const active = statusFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => {
                        setPagination((p) => ({ ...p, page: 1 }));
                        setStatusFilter(f.value);
                      }}
                      style={{
                        height: 40,
                        padding: '0 14px',
                        borderRadius: 8,
                        border: `1px solid ${active ? 'var(--hof-amber)' : 'var(--hof-border)'}`,
                        background: active ? 'rgba(232,101,26,0.15)' : 'var(--hof-elevated)',
                        color: active ? 'var(--hof-amber)' : 'var(--hof-text-sec)',
                        fontFamily: 'Inter, system-ui',
                        fontSize: 13,
                        fontWeight: active ? 600 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(232,74,26,0.1)',
              border: '1px solid rgba(232,74,26,0.3)',
              borderRadius: 8,
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              color: 'var(--hof-error)',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <TableHeader />

            {loading ? (
              <div
                style={{
                  padding: 18,
                  color: 'var(--hof-text-sec)',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                }}
              >
                Loading photos…
              </div>
            ) : photos.length === 0 ? (
              <div
                style={{
                  padding: 18,
                  color: 'var(--hof-text-sec)',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                }}
              >
                No photos match these filters.
              </div>
            ) : (
              photos.map((photo, i) => {
                const uploaderMeta = `@${photo.handle}${photo.email ? ` · ${photo.email}` : ''}`;
                return (
                  <div
                    key={photo.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: TABLE_COLUMNS,
                      gap: 12,
                      padding: '12px 18px',
                      alignItems: 'center',
                      borderBottom: i < photos.length - 1 ? '1px solid var(--hof-border)' : 'none',
                      fontFamily: 'Inter, system-ui',
                      fontSize: 13,
                      color: 'var(--hof-text)',
                      minWidth: TABLE_MIN_WIDTH,
                    }}
                  >
                    <div>
                      <PhotoThumb
                        url={photo.publicUrl}
                        onPreview={() => photo.publicUrl && setPreviewUrl(photo.publicUrl)}
                      />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <EllipsisText title={photo.displayName} style={{ fontWeight: 500 }}>
                        {photo.displayName}
                      </EllipsisText>
                      <EllipsisText
                        title={uploaderMeta}
                        style={{
                          fontSize: 12,
                          color: 'var(--hof-text-sec)',
                          marginTop: 2,
                        }}
                      >
                        {uploaderMeta}
                      </EllipsisText>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <EllipsisText
                        title={photo.fileName}
                        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                      >
                        {photo.fileName}
                      </EllipsisText>
                      {photo.caption ? (
                        <EllipsisText
                          title={photo.caption}
                          style={{
                            fontSize: 11,
                            color: 'var(--hof-text-dis)',
                            marginTop: 2,
                          }}
                        >
                          {photo.caption}
                        </EllipsisText>
                      ) : null}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <Pill tone="neutral" size="sm">
                        {photo.eventLabel}
                      </Pill>
                      <EllipsisText
                        title={photo.eventName}
                        style={{
                          fontSize: 12,
                          color: 'var(--hof-text-sec)',
                          marginTop: 4,
                        }}
                      >
                        {photo.eventName}
                      </EllipsisText>
                    </div>

                    <EllipsisText
                      title={formatWhen(photo.createdAt)}
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 11,
                        color: 'var(--hof-text-sec)',
                      }}
                    >
                      {formatWhen(photo.createdAt)}
                    </EllipsisText>

                    <div>
                      <Pill tone={statusTone(photo.status)}>{photo.status}</Pill>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 6,
                        minWidth: 0,
                        flexWrap: 'wrap',
                      }}
                    >
                      {photo.publicUrl ? (
                        <button
                          type="button"
                          disabled={busyId === photo.id}
                          onClick={() => setPreviewUrl(photo.publicUrl)}
                          style={actionBtnStyle(ghostBtn, busyId === photo.id)}
                        >
                          Preview
                        </button>
                      ) : null}

                      {photo.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === photo.id}
                            onClick={() => void updatePhotoStatus(photo.id, 'approved')}
                            style={actionBtnStyle(approveBtn, busyId === photo.id)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === photo.id}
                            onClick={() => void updatePhotoStatus(photo.id, 'rejected')}
                            style={actionBtnStyle(ghostBtn, busyId === photo.id)}
                          >
                            Reject
                          </button>
                        </>
                      ) : null}

                      {photo.status === 'approved' ? (
                        <button
                          type="button"
                          disabled={busyId === photo.id}
                          onClick={() => void updatePhotoStatus(photo.id, 'inactive')}
                          style={actionBtnStyle(warnBtn, busyId === photo.id)}
                        >
                          Deactivate
                        </button>
                      ) : null}

                      {photo.status === 'inactive' ? (
                        <button
                          type="button"
                          disabled={busyId === photo.id}
                          onClick={() => void updatePhotoStatus(photo.id, 'approved')}
                          style={actionBtnStyle(approveBtn, busyId === photo.id)}
                        >
                          Reactivate
                        </button>
                      ) : null}

                      {photo.status === 'rejected' ? (
                        <button
                          type="button"
                          disabled={busyId === photo.id}
                          onClick={() => void updatePhotoStatus(photo.id, 'approved')}
                          style={actionBtnStyle(approveBtn, busyId === photo.id)}
                        >
                          Approve
                        </button>
                      ) : null}

                      {photo.status !== 'inactive' && photo.status !== 'approved' ? (
                        <button
                          type="button"
                          disabled={busyId === photo.id}
                          onClick={() => void updatePhotoStatus(photo.id, 'inactive')}
                          style={actionBtnStyle(warnBtn, busyId === photo.id)}
                        >
                          Deactivate
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={busyId === photo.id}
                        onClick={() => void deletePhoto(photo.id, photo.fileName)}
                        style={actionBtnStyle(dangerBtn, busyId === photo.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            <TablePagination
              page={pagination.page}
              pageSize={pagination.limit}
              total={pagination.total}
              onPageChange={(p) => setPagination((cur) => ({ ...cur, page: p }))}
            />
          </div>
        </div>
      </div>

      <MediaUploadModal
        open={uploadOpen}
        events={events}
        defaultEventId={eventId || events[0]?.id}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />

      {previewUrl ? (
        <ImageLightbox urls={[previewUrl]} onClose={() => setPreviewUrl(null)} />
      ) : null}

      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            width: 'min(360px, calc(100vw - 32px))',
          }}
        >
          <HofToast kind={toast.kind} onDismiss={() => setToast(null)}>
            {toast.message}
          </HofToast>
        </div>
      ) : null}
    </>
  );
}
