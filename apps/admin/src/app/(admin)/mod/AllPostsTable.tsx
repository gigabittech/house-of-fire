'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { TablePagination, DEFAULT_PAGE_SIZE } from '@/components/TablePagination';

type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'hidden' | 'draft';

type PostRow = {
  id: string;
  channel: string;
  title: string;
  body: string | null;
  is_pinned: boolean;
  is_anonymous: boolean;
  moderation_status: ModerationStatus;
  moderation_note: string | null;
  reply_count: number;
  created_at: string;
  profiles: { handle: string; display_name: string } | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function statusTone(status: ModerationStatus): Parameters<typeof Pill>[0]['tone'] {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'pending') return 'warning';
  if (status === 'hidden') return 'muted';
  return 'neutral';
}

const GRID = '150px 120px 90px 1fr 100px 48px';

interface AllPostsTableProps {
  onRefreshQueue?: () => void;
}

export function AllPostsTable({ onRefreshQueue }: AllPostsTableProps) {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ModerationStatus | ''>('');
  const [channel, setChannel] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set('page', String(pagination.page));
    sp.set('limit', String(pagination.limit));
    if (search.trim()) sp.set('search', search.trim());
    if (status) sp.set('status', status);
    if (channel) sp.set('channel', channel);
    if (dateFrom) sp.set('dateFrom', dateFrom);
    if (dateTo) sp.set('dateTo', dateTo);
    return sp.toString();
  }, [pagination.page, pagination.limit, search, status, channel, dateFrom, dateTo]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/posts?${queryString}`);
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? 'Failed to load posts');
      }
      const list = (await res.json()) as { data: PostRow[]; pagination: Pagination };
      setRows(list.data ?? []);
      setPagination(list.pagination);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openMenuId]);

  async function patchPost(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = (await res.json()) as { error?: string };
      throw new Error(d.error ?? 'Action failed');
    }
  }

  async function deletePost(id: string) {
    const res = await fetch(`/api/admin/mod?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = (await res.json()) as { error?: string };
      throw new Error(d.error ?? 'Delete failed');
    }
  }

  async function runAction(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    setActionError(null);
    try {
      await fn();
      await load();
      onRefreshQueue?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="hof-admin-pad-section-bottom">
      <div
        style={{
          background: 'var(--hof-surface)',
          border: '1px solid var(--hof-border)',
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div className="hof-admin-filter-grid">
          <div style={{ position: 'relative' }}>
            <div
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            >
              <Icon name="search" size={14} color="var(--hof-text-sec)" />
            </div>
            <input
              value={search}
              onChange={(e) => {
                setPagination((p) => ({ ...p, page: 1 }));
                setSearch(e.target.value);
              }}
              placeholder="Search title or body…"
              style={{ ...inputStyle, paddingLeft: 36 }}
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setPagination((p) => ({ ...p, page: 1 }));
              setStatus(e.target.value as ModerationStatus | '');
            }}
            style={inputStyle}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="hidden">Hidden</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={channel}
            onChange={(e) => {
              setPagination((p) => ({ ...p, page: 1 }));
              setChannel(e.target.value);
            }}
            style={inputStyle}
          >
            <option value="">All channels</option>
            <option value="general">#general</option>
            <option value="lineup">#lineup</option>
            <option value="recap">#recap</option>
            <option value="help">#help</option>
            <option value="crew">#crew</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setPagination((p) => ({ ...p, page: 1 }));
              setDateFrom(e.target.value);
            }}
            style={inputStyle}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setPagination((p) => ({ ...p, page: 1 }));
              setDateTo(e.target.value);
            }}
            style={inputStyle}
          />
        </div>
      </div>

      {actionError ? (
        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(232,74,26,0.1)',
            border: '1px solid rgba(232,74,26,0.25)',
            fontFamily: 'Inter, system-ui',
            fontSize: 13,
            color: 'var(--hof-error)',
          }}
        >
          {actionError}
        </div>
      ) : null}

      <div
        style={{
          marginTop: 16,
          border: '1px solid var(--hof-border)',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--hof-surface)',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--hof-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'Inter, system-ui',
                fontSize: 10,
                color: 'var(--hof-text-sec)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              All posts
            </div>
            <div
              style={{
                fontFamily: 'Inter, system-ui',
                fontSize: 12,
                color: 'var(--hof-text-sec)',
                marginTop: 4,
              }}
            >
              {loading ? 'Loading…' : `${pagination.total} posts`}
            </div>
          </div>
        </div>

        <div className="hof-admin-table-scroll">
        <div className="hof-admin-data-table hof-admin-data-table--lg">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            gap: 12,
            padding: '10px 16px',
            borderBottom: '1px solid var(--hof-border)',
            fontFamily: 'Inter, system-ui',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--hof-text-sec)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          <div>When</div>
          <div>Author</div>
          <div>Channel</div>
          <div>Post</div>
          <div>Status</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </div>

        {loading ? (
          <div
            style={{ padding: 20, color: 'var(--hof-text-sec)', fontFamily: 'Inter, system-ui' }}
          >
            Loading…
          </div>
        ) : loadError ? (
          <div style={{ padding: 20, color: 'var(--hof-error)', fontFamily: 'Inter, system-ui' }}>
            {loadError}
          </div>
        ) : rows.length === 0 ? (
          <div
            style={{ padding: 20, color: 'var(--hof-text-sec)', fontFamily: 'Inter, system-ui' }}
          >
            No posts found.
          </div>
        ) : (
          rows.map((row) => {
            const author = row.is_anonymous ? 'Anonymous' : `@${row.profiles?.handle ?? 'unknown'}`;
            const preview = row.body?.trim() || row.title;
            return (
              <div
                key={row.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--hof-border)',
                  alignItems: 'start',
                }}
              >
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    color: 'var(--hof-text-sec)',
                  }}
                >
                  {formatWhen(row.created_at)}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontSize: 12,
                    color: 'var(--hof-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {author}
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    color: 'var(--hof-amber)',
                  }}
                >
                  #{row.channel}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'Inter, system-ui',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--hof-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.title || '(no title)'}
                    {row.is_pinned ? (
                      <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--hof-amber)' }}>
                        pinned
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontFamily: 'Inter, system-ui',
                      fontSize: 11,
                      color: 'var(--hof-text-sec)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {preview}
                  </div>
                  {row.moderation_status === 'rejected' && row.moderation_note ? (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        color: 'var(--hof-error)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Reason: {row.moderation_note}
                    </div>
                  ) : null}
                  <div
                    style={{
                      marginTop: 4,
                      fontFamily: 'Inter, system-ui',
                      fontSize: 10,
                      color: 'var(--hof-text-dis)',
                    }}
                  >
                    {row.reply_count} {row.reply_count === 1 ? 'reply' : 'replies'}
                  </div>
                </div>
                <div>
                  <Pill tone={statusTone(row.moderation_status)}>{row.moderation_status}</Pill>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <PostActionsMenu
                    postId={row.id}
                    status={row.moderation_status}
                    busy={busyId === row.id}
                    open={openMenuId === row.id}
                    onToggle={() => setOpenMenuId((cur) => (cur === row.id ? null : row.id))}
                    onApprove={() => {
                      setOpenMenuId(null);
                      void runAction(row.id, () => patchPost(row.id, { action: 'approved' }));
                    }}
                    onReject={() => {
                      setOpenMenuId(null);
                      const reason = window.prompt('Optional reason for rejection:') ?? '';
                      void runAction(row.id, () =>
                        patchPost(row.id, { action: 'rejected', reason: reason || undefined }),
                      );
                    }}
                    onHide={() => {
                      setOpenMenuId(null);
                      if (!window.confirm('Hide this post from the board?')) return;
                      void runAction(row.id, () => patchPost(row.id, { action: 'hidden' }));
                    }}
                    onActivate={() => {
                      setOpenMenuId(null);
                      if (!window.confirm('Activate this post and show it on the board again?'))
                        return;
                      void runAction(row.id, () => patchPost(row.id, { action: 'approved' }));
                    }}
                    onDelete={() => {
                      setOpenMenuId(null);
                      if (
                        !window.confirm(
                          'Permanently delete this post? The author will be notified.',
                        )
                      )
                        return;
                      void runAction(row.id, () => deletePost(row.id));
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
        </div>
        </div>

        <TablePagination
          page={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          onPageChange={(p) => setPagination((cur) => ({ ...cur, page: p }))}
        />
      </div>
    </div>
  );
}

function PostActionsMenu({
  postId,
  status,
  busy,
  open,
  onToggle,
  onApprove,
  onReject,
  onHide,
  onActivate,
  onDelete,
}: {
  postId: string;
  status: ModerationStatus;
  busy: boolean;
  open: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onHide: () => void;
  onActivate: () => void;
  onDelete: () => void;
}) {
  const canApprove = status === 'pending';
  const canReject = status === 'pending';
  const canHide = status !== 'hidden';
  const canActivate = status === 'hidden';

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        aria-label={`Actions for post ${postId}`}
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
          {canApprove ? (
            <button
              type="button"
              role="menuitem"
              onClick={onApprove}
              style={menuItemStyle('success')}
            >
              Approve
            </button>
          ) : null}
          {canReject ? (
            <button type="button" role="menuitem" onClick={onReject} style={menuItemStyle()}>
              Reject
            </button>
          ) : null}
          {(canApprove || canReject) && (canActivate || canHide) ? <MenuDivider /> : null}
          {canActivate ? (
            <button
              type="button"
              role="menuitem"
              onClick={onActivate}
              style={menuItemStyle('success')}
            >
              Activate post
            </button>
          ) : null}
          {canHide ? (
            <button type="button" role="menuitem" onClick={onHide} style={menuItemStyle()}>
              Hide post
            </button>
          ) : null}
          {canApprove || canReject || canActivate || canHide ? <MenuDivider /> : null}
          <button type="button" role="menuitem" onClick={onDelete} style={menuItemStyle('danger')}>
            Delete post
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuDivider() {
  return <div style={{ height: 1, background: 'var(--hof-border)', margin: '4px 0' }} />;
}

function menuItemStyle(variant: 'default' | 'danger' | 'success' = 'default'): React.CSSProperties {
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
          : 'var(--hof-text)',
    cursor: 'pointer',
  };
}
