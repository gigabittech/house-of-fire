'use client';

import { eventPhotoLightboxUrl, eventPhotoPreviewUrl } from '@hof/media';
import { HofToast, ImageLightbox, type ToastKind } from '@hof/ui';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { MediaUploadModal } from '@/components/MediaUploadModal';
import { PaneHeader } from '@/components/PaneHeader';
import { Pill } from '@/components/Pill';
import { DEFAULT_PAGE_SIZE } from '@/components/TablePagination';
import { useAdminMediaFeed } from '@/hooks/useAdminMediaFeed';

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
  storagePath: string;
  createdAt: string;
}

interface ToastState {
  kind: ToastKind;
  message: string;
}

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'pending', label: 'Pending' },
];

const TABLE_COLUMNS = '56px 1.5fr 1fr 1fr 120px 88px 56px';
const TABLE_MIN_WIDTH = 860;
const MEDIA_ROW_HEIGHT = 72;

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

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
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
    storagePath: row.storage_path,
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

function PhotoThumb({ photo, onPreview }: { photo: PhotoItem; onPreview: () => void }) {
  const url =
    eventPhotoPreviewUrl({ storage_path: photo.storagePath, public_url: photo.publicUrl }) ??
    photo.publicUrl;

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
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [eventId, setEventId] = useState('');
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const debouncedEmail = useDebouncedValue(email, 400);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set('status', statusFilter);
    sp.set('limit', String(DEFAULT_PAGE_SIZE));
    if (eventId) sp.set('eventId', eventId);
    if (debouncedSearch) sp.set('search', debouncedSearch);
    if (debouncedEmail) sp.set('email', debouncedEmail);
    if (dateFrom) sp.set('dateFrom', dateFrom);
    if (dateTo) sp.set('dateTo', dateTo);
    return sp.toString();
  }, [statusFilter, eventId, debouncedSearch, debouncedEmail, dateFrom, dateTo]);

  const { photos, totalCount, hasMore, loading, loadingMore, error, refresh, loadMore } =
    useAdminMediaFeed<PhotoApiRow, PhotoItem>(queryString, mapPhotoRow);

  const hasActiveFilters =
    Boolean(eventId) ||
    Boolean(debouncedSearch) ||
    Boolean(debouncedEmail) ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    statusFilter !== 'pending';

  function clearFilters() {
    setEventId('');
    setSearch('');
    setEmail('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('pending');
  }

  const showToast = useCallback((kind: ToastKind, message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
    void refresh();
  }, [refresh]);

  const rowVirtualizer = useVirtualizer({
    count: photos.length + (hasMore ? 1 : 0),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => MEDIA_ROW_HEIGHT,
    overscan: 8,
  });

  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;
    const items = rowVirtualizer.getVirtualItems();
    const last = items[items.length - 1];
    if (last && last.index >= photos.length - 1) {
      void loadMore();
    }
  }, [hasMore, loading, loadingMore, loadMore, photos.length, rowVirtualizer]);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openMenuId]);

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
      void refresh();
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
      void refresh();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  function handleUploaded(uploadedEventId: string, result: { uploaded: number; failed: number }) {
    setEventId(uploadedEventId);
    setStatusFilter('all');
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
    void refresh();
    void refreshPendingCount();
  }

  const headerSub = loading
    ? 'Loading…'
    : statusFilter === 'pending'
      ? `${totalCount} pending`
      : `${totalCount} photo${totalCount === 1 ? '' : 's'}`;

  const openPhotoPreview = useCallback((photo: PhotoItem) => {
    const url =
      eventPhotoLightboxUrl({
        storage_path: photo.storagePath,
        public_url: photo.publicUrl,
      }) ?? photo.publicUrl;
    if (url) setPreviewUrl(url);
  }, []);

  const renderPhotoRow = (photo: PhotoItem, borderBottom: boolean) => {
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
          borderBottom: borderBottom ? '1px solid var(--hof-border)' : 'none',
          fontFamily: 'Inter, system-ui',
          fontSize: 13,
          color: 'var(--hof-text)',
          minWidth: TABLE_MIN_WIDTH,
          height: MEDIA_ROW_HEIGHT,
          boxSizing: 'border-box',
        }}
      >
        <div>
          <PhotoThumb photo={photo} onPreview={() => openPhotoPreview(photo)} />
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

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PhotoActionsMenu
            photo={photo}
            busy={busyId === photo.id}
            open={openMenuId === photo.id}
            onToggle={() => setOpenMenuId((cur) => (cur === photo.id ? null : photo.id))}
            onPreview={() => {
              setOpenMenuId(null);
              openPhotoPreview(photo);
            }}
            onApprove={() => {
              setOpenMenuId(null);
              void updatePhotoStatus(photo.id, 'approved');
            }}
            onReject={() => {
              setOpenMenuId(null);
              void updatePhotoStatus(photo.id, 'rejected');
            }}
            onDeactivate={() => {
              setOpenMenuId(null);
              void updatePhotoStatus(photo.id, 'inactive');
            }}
            onReactivate={() => {
              setOpenMenuId(null);
              void updatePhotoStatus(photo.id, 'approved');
            }}
            onDelete={() => {
              setOpenMenuId(null);
              void deletePhoto(photo.id, photo.fileName);
            }}
          />
        </div>
      </div>
    );
  };

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

      <div className="hof-admin-inline-pad">
        <div
          style={{
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="hof-admin-filter-grid" style={{ alignItems: 'end' }}>
              <div className="hof-admin-filter-span-2" style={{ minWidth: 0, position: 'relative' }}>
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
                  Search
                </div>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  >
                    <Icon name="search" size={14} color="var(--hof-text-sec)" />
                  </div>
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                    }}
                    placeholder="Name, handle, file, caption…"
                    style={{ ...inputStyle, paddingLeft: 36 }}
                  />
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
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
                  Customer email
                </div>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  placeholder="uploader@email.com"
                  style={inputStyle}
                />
              </div>
              <div style={{ minWidth: 0 }}>
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
                  Uploaded from
                </div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                  }}
                  style={inputStyle}
                />
              </div>
              <div style={{ minWidth: 0 }}>
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
                  Uploaded to
                </div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                  }}
                  style={inputStyle}
                />
              </div>
            </div>

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
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{
                    height: 40,
                    padding: '0 14px',
                    borderRadius: 8,
                    border: '1px solid var(--hof-border)',
                    background: 'transparent',
                    color: 'var(--hof-text-sec)',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="hof-admin-pad-section-bottom" style={{ paddingTop: 0 }}>
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
          <div className="hof-admin-table-scroll">
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
              <div
                ref={scrollRef}
                style={{
                  maxHeight: 'calc(100vh - 320px)',
                  overflow: 'auto',
                  minWidth: TABLE_MIN_WIDTH,
                }}
              >
                <div
                  style={{
                    height: rowVirtualizer.getTotalSize(),
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const isLoaderRow = virtualRow.index >= photos.length;
                    const photo = photos[virtualRow.index];

                    return (
                      <div
                        key={virtualRow.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {isLoaderRow ? (
                          <div
                            style={{
                              height: MEDIA_ROW_HEIGHT,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--hof-text-sec)',
                              fontFamily: 'Inter, system-ui',
                              fontSize: 12,
                            }}
                          >
                            {loadingMore ? 'Loading more photos…' : null}
                          </div>
                        ) : (
                          photo &&
                          renderPhotoRow(photo, virtualRow.index < photos.length - 1 || hasMore)
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loading && photos.length > 0 ? (
              <div
                style={{
                  padding: '12px 18px',
                  borderTop: '1px solid var(--hof-border)',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 12,
                  color: 'var(--hof-text-sec)',
                }}
              >
                Showing {photos.length.toLocaleString('en-US')} of{' '}
                {totalCount.toLocaleString('en-US')}
                {hasMore ? ' · scroll for more' : ''}
              </div>
            ) : null}
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

function PhotoActionsMenu({
  photo,
  busy,
  open,
  onToggle,
  onPreview,
  onApprove,
  onReject,
  onDeactivate,
  onReactivate,
  onDelete,
}: {
  photo: PhotoItem;
  busy: boolean;
  open: boolean;
  onToggle: () => void;
  onPreview: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onDelete: () => void;
}) {
  const showApprove = photo.status === 'pending' || photo.status === 'rejected';
  const showReject = photo.status === 'pending';
  const showDeactivate =
    photo.status === 'approved' || (photo.status !== 'inactive' && photo.status !== 'approved');
  const showReactivate = photo.status === 'inactive';

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        aria-label={`Actions for ${photo.fileName}`}
        aria-expanded={open}
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: '1px solid var(--hof-border)',
          background: open ? 'var(--hof-elevated)' : 'transparent',
          color: 'var(--hof-text-sec)',
          cursor: busy ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter, system-ui',
          fontSize: 16,
          lineHeight: 1,
          letterSpacing: 1,
          opacity: busy ? 0.6 : 1,
        }}
      >
        ⋯
      </button>
      {open ? (
        <div
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 20,
            minWidth: 148,
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            overflow: 'hidden',
          }}
        >
          {photo.publicUrl ? (
            <button type="button" role="menuitem" onClick={onPreview} style={menuItemStyle()}>
              Preview
            </button>
          ) : null}
          {showApprove ? (
            <button
              type="button"
              role="menuitem"
              onClick={onApprove}
              style={menuItemStyle('success')}
            >
              Approve
            </button>
          ) : null}
          {showReject ? (
            <button type="button" role="menuitem" onClick={onReject} style={menuItemStyle()}>
              Reject
            </button>
          ) : null}
          {showReactivate ? (
            <button
              type="button"
              role="menuitem"
              onClick={onReactivate}
              style={menuItemStyle('success')}
            >
              Reactivate
            </button>
          ) : null}
          {showDeactivate ? (
            <button
              type="button"
              role="menuitem"
              onClick={onDeactivate}
              style={menuItemStyle('warn')}
            >
              Deactivate
            </button>
          ) : null}
          <PhotoMenuDivider />
          <button type="button" role="menuitem" onClick={onDelete} style={menuItemStyle('danger')}>
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PhotoMenuDivider() {
  return <div style={{ height: 1, background: 'var(--hof-border)', margin: '4px 0' }} />;
}

function menuItemStyle(
  variant: 'default' | 'danger' | 'success' | 'warn' = 'default',
): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    fontFamily: 'Inter, system-ui',
    fontSize: 13,
    color:
      variant === 'danger'
        ? 'var(--hof-error)'
        : variant === 'success'
          ? 'var(--hof-success)'
          : variant === 'warn'
            ? 'var(--hof-warning)'
            : 'var(--hof-text)',
    cursor: 'pointer',
  };
}
