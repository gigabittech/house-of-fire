'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Kpi } from '@/components/Kpi';
import { PaneHeader } from '@/components/PaneHeader';
import { Pill } from '@/components/Pill';
import { TablePagination, DEFAULT_PAGE_SIZE } from '@/components/TablePagination';
import { downloadTextFile } from '@/lib/downloadFile';

type EmailLogStatus = 'queued' | 'sent' | 'failed';

type EmailLogRow = {
  id: string;
  created_at: string;
  sent_at: string | null;
  status: EmailLogStatus;
  provider: string;
  provider_message_id: string | null;
  app: 'mobile' | 'admin';
  kind: string | null;
  project_id: string | null;
  to_address: string;
  subject: string;
  text_body: string | null;
  html_body: string | null;
  from_email: string | null;
  reply_to: string | null;
  error_message: string | null;
  meta: unknown | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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

function statusTone(status: EmailLogStatus): Parameters<typeof Pill>[0]['tone'] {
  if (status === 'sent') return 'success';
  if (status === 'failed') return 'danger';
  return 'muted';
}

function canResend(row: EmailLogRow): boolean {
  return row.status === 'failed';
}

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

export default function EmailLogPage() {
  const [rows, setRows] = useState<EmailLogRow[]>([]);
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
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EmailLogStatus | ''>('');
  const [app, setApp] = useState<'mobile' | 'admin' | ''>('');
  const [kind, setKind] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set('page', String(pagination.page));
    sp.set('limit', String(pagination.limit));
    if (search.trim()) sp.set('search', search.trim());
    if (status) sp.set('status', status);
    if (app) sp.set('app', app);
    if (kind.trim()) sp.set('kind', kind.trim());
    if (dateFrom) sp.set('dateFrom', dateFrom);
    if (dateTo) sp.set('dateTo', dateTo);
    return sp.toString();
  }, [pagination.page, pagination.limit, search, status, app, kind, dateFrom, dateTo]);

  const statsQueryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (app) sp.set('app', app);
    if (kind.trim()) sp.set('kind', kind.trim());
    if (dateFrom) sp.set('dateFrom', dateFrom);
    if (dateTo) sp.set('dateTo', dateTo);
    return sp.toString();
  }, [app, kind, dateFrom, dateTo]);

  const [stats, setStats] = useState<{
    sent30d: number;
    failed: number;
    inQueue: number;
    deliveryPct: number;
    total: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/admin/email-logs?${queryString}`),
        fetch(`/api/admin/email-logs/stats?${statsQueryString}`),
      ]);

      if (!listRes.ok) {
        const d = (await listRes.json()) as { error?: string };
        throw new Error(d.error ?? 'Failed to load email logs');
      }
      if (!statsRes.ok) {
        const d = (await statsRes.json()) as { error?: string };
        throw new Error(d.error ?? 'Failed to load email log stats');
      }

      const list = (await listRes.json()) as { data: EmailLogRow[]; pagination: Pagination };
      const statsData = (await statsRes.json()) as {
        sent30d: number;
        failed: number;
        inQueue: number;
        deliveryPct: number;
        total: number;
      };

      setRows(list.data ?? []);
      setPagination(list.pagination);
      setStats(statsData);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [queryString, statsQueryString]);

  useEffect(() => {
    void load();
  }, [load]);

  async function retry(id: string) {
    setRetryingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/email-logs/${id}/retry`, { method: 'POST' });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? 'Retry failed');
      }
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setRetryingId(null);
    }
  }

  function exportCsv() {
    const header = [
      'created_at',
      'status',
      'app',
      'kind',
      'provider',
      'to_address',
      'subject',
      'from_email',
      'provider_message_id',
      'error_message',
    ];
    const body = rows.map((r) => [
      r.created_at,
      r.status,
      r.app,
      r.kind ?? '',
      r.provider,
      r.to_address,
      r.subject,
      r.from_email ?? '',
      r.provider_message_id ?? '',
      r.error_message ?? '',
    ]);

    const csv = [header, ...body]
      .map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    downloadTextFile(csv, `email-log-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  }

  const headerSub = loading
    ? 'Loading…'
    : stats
      ? `${stats.total} emails · ${stats.sent30d} sent · ${stats.failed} failed`
      : 'Outbound email audit trail';

  return (
    <>
      <PaneHeader
        eyebrow="Admin"
        title="Email log"
        sub={headerSub}
        cta={
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            style={{
              height: 40,
              padding: '0 14px',
              borderRadius: 8,
              background: 'var(--hof-elevated)',
              border: '1px solid var(--hof-border)',
              color: 'var(--hof-text)',
              cursor: rows.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: rows.length === 0 ? 0.5 : 1,
            }}
          >
            <Icon name="download" size={14} color="var(--hof-text-sec)" />
            Export CSV
          </button>
        }
      />

      <div style={{ padding: '20px 28px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          <Kpi label="Sent (30d)" value={String(stats?.sent30d ?? '—')} />
          <Kpi
            label="Delivery rate"
            value={stats ? `${stats.deliveryPct}%` : '—'}
            tone={stats && stats.deliveryPct < 90 ? 'warning' : 'neutral'}
          />
          <Kpi label="Failed" value={String(stats?.failed ?? '—')} tone="warning" />
          <Kpi label="In queue" value={String(stats?.inQueue ?? '—')} tone="muted" />
        </div>

        <div
          style={{
            marginTop: 18,
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              gap: 10,
            }}
          >
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="search" size={14} color="var(--hof-text-sec)" />
              </div>
              <input
                value={search}
                onChange={(e) => {
                  setPagination((p) => ({ ...p, page: 1 }));
                  setSearch(e.target.value);
                }}
                placeholder="Search subject, to, body, error…"
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setPagination((p) => ({ ...p, page: 1 }));
                setStatus(e.target.value as EmailLogStatus | '');
              }}
              style={inputStyle}
            >
              <option value="">All statuses</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={app}
              onChange={(e) => {
                setPagination((p) => ({ ...p, page: 1 }));
                setApp(e.target.value as 'mobile' | 'admin' | '');
              }}
              style={inputStyle}
            >
              <option value="">All apps</option>
              <option value="mobile">Mobile</option>
              <option value="admin">Admin</option>
            </select>
            <input
              value={kind}
              onChange={(e) => {
                setPagination((p) => ({ ...p, page: 1 }));
                setKind(e.target.value);
              }}
              placeholder="Kind (receipt, auth…)"
              style={inputStyle}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
              display: 'grid',
              gridTemplateColumns: '160px 140px 90px 120px 1fr 100px',
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
            <div>To</div>
            <div>Status</div>
            <div>Source</div>
            <div>Subject</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {loading ? (
            <div style={{ padding: 20, color: 'var(--hof-text-sec)', fontFamily: 'Inter, system-ui' }}>
              Loading…
            </div>
          ) : loadError ? (
            <div style={{ padding: 20, color: 'var(--hof-error)', fontFamily: 'Inter, system-ui' }}>
              {loadError}
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--hof-text-sec)', fontFamily: 'Inter, system-ui' }}>
              No email logs found.
            </div>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 140px 90px 120px 1fr 100px',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--hof-border)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    color: 'var(--hof-text-sec)',
                  }}
                >
                  {formatWhen(r.created_at)}
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
                  {r.to_address}
                </div>
                <div>
                  <Pill tone={statusTone(r.status)}>{r.status}</Pill>
                </div>
                <div style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text-sec)' }}>
                  {r.app}
                  {r.kind ? (
                    <div style={{ fontSize: 10, color: 'var(--hof-text-dis)', marginTop: 2 }}>{r.kind}</div>
                  ) : null}
                </div>
                <div style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text)' }}>
                  {r.subject}
                  {r.status === 'failed' && r.error_message ? (
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
                      {r.error_message}
                    </div>
                  ) : null}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {canResend(r) ? (
                    <button
                      type="button"
                      onClick={() => void retry(r.id)}
                      disabled={retryingId === r.id}
                      style={{
                        height: 28,
                        padding: '0 10px',
                        borderRadius: 8,
                        border: '1px solid var(--hof-border)',
                        background: 'var(--hof-amber)',
                        color: 'var(--hof-bg)',
                        cursor: 'pointer',
                        fontFamily: 'Inter, system-ui',
                        fontSize: 12,
                        fontWeight: 600,
                        opacity: retryingId === r.id ? 0.6 : 1,
                      }}
                    >
                      {retryingId === r.id ? 'Sending…' : 'Resend'}
                    </button>
                  ) : (
                    <span style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text-dis)' }}>
                      —
                    </span>
                  )}
                </div>
              </div>
            ))
          )}

          <TablePagination
            page={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}
            onPageChange={(p) => setPagination((cur) => ({ ...cur, page: p }))}
          />
        </div>
      </div>
    </>
  );
}
