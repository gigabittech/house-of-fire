'use client';

import { HofToast, type ToastKind } from '@hof/ui';
import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Kpi } from '@/components/Kpi';
import { MemberEditModal } from '@/components/MemberEditModal';
import { Pill } from '@/components/Pill';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@/components/TablePagination';
import type { ApiPagination } from '@/lib/pagination';
import { adminLayout } from '@/lib/adminLayout';
import { type MemberApiPayload, type MemberRow, mapMemberRow } from '@/lib/mapMemberRow';

interface MembersStats {
  total: number;
  new_this_month: number;
  crew_count: number;
  photographer_count: number;
  return_rate: number;
  active_90: number;
}

interface ToastState {
  kind: ToastKind;
  message: string;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [page, setPage] = useState(1);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [stats, setStats] = useState<MembersStats | null>(null);
  const [pagination, setPagination] = useState<ApiPagination>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(DEFAULT_PAGE_SIZE));
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      const res = await fetch(`/api/admin/members?${params}`);
      const data = (await res.json()) as {
        members?: MemberApiPayload[];
        stats?: MembersStats;
        pagination?: ApiPagination;
        error?: string;
      };
      if (data.error) {
        setError(data.error);
      } else {
        setMembers((data.members ?? []).map(mapMemberRow));
        setStats(data.stats ?? null);
        if (data.pagination) setPagination(data.pagination);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <>
      <div className={adminLayout.paneHeader}>
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
            Members
          </div>
          <div
            className={adminLayout.paneTitle}
            style={{
              fontFamily: 'Clash Display, system-ui',
              fontWeight: 600,
              fontSize: 26,
              color: 'var(--hof-text)',
              letterSpacing: '-0.01em',
              marginTop: 4,
            }}
          >
            {loading ? '…' : `${stats?.total.toLocaleString() ?? '0'} members`}
          </div>
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text-sec)',
              marginTop: 4,
            }}
          >
            {loading || !stats
              ? 'Loading…'
              : `+${stats.new_this_month} this month · ${stats.return_rate}% return rate · ${stats.crew_count} Crew · ${stats.photographer_count} Photographers`}
          </div>
        </div>
        <div
          className={adminLayout.searchBox}
          style={{ background: 'var(--hof-surface)', flex: '0 1 260px', width: 260, maxWidth: '100%' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle stroke="var(--hof-text-sec)" strokeWidth="1.5" cx="11" cy="11" r="7" />
            <path
              stroke="var(--hof-text-sec)"
              strokeWidth="1.5"
              strokeLinecap="round"
              d="M20 20 L16 16"
            />
          </svg>
          <input
            placeholder="Search name or handle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="hof-admin-inline-pad">
        <div className={adminLayout.kpiGrid}>
        <Kpi
          label="Total members"
          value={loading ? '…' : String(stats?.total ?? 0)}
          delta={stats ? `+${stats.new_this_month} this month` : ''}
          tone="amber"
        />
        <Kpi
          label="Active (90 day)"
          value={loading ? '…' : String(stats?.active_90 ?? 0)}
          delta={
            stats && stats.total > 0
              ? `${Math.round((stats.active_90 / stats.total) * 100)}% of total`
              : ''
          }
          tone="neutral"
        />
        <Kpi
          label="Return rate"
          value={loading ? '…' : `${stats?.return_rate ?? 0}%`}
          delta=""
          tone="amber"
        />
        <Kpi
          label="Crew & comp"
          value={loading ? '…' : String(stats?.crew_count ?? 0)}
          delta={
            stats ? `${stats.crew_count} Crew · ${stats.photographer_count} Photographers` : ''
          }
          tone="muted"
        />
        </div>
      </div>

      <div className={adminLayout.padSectionBottom} style={{ paddingTop: 0 }}>
        <div
          style={{
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div className={adminLayout.tableScroll}>
          <div className={adminLayout.dataTableLg}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.8fr 1fr 80px',
              padding: '12px 18px',
              borderBottom: '1px solid var(--hof-border)',
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              color: 'var(--hof-text-sec)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            <div>Member</div>
            <div>Email</div>
            <div>Tier</div>
            <div>Themes</div>
            <div>Last seen</div>
            <div>Posts</div>
            <div />
          </div>
          {error && (
            <div style={{ padding: 18, color: 'var(--hof-danger)', fontSize: 13 }}>{error}</div>
          )}
          {loading && !error && (
            <div style={{ padding: 18, color: 'var(--hof-text-sec)', fontSize: 13 }}>
              Loading members…
            </div>
          )}
          {!loading &&
            !error &&
            members.map((m, i) => {
              const initials = m.name
                .split(' ')
                .map((s) => s[0] ?? '')
                .join('')
                .slice(0, 2);
              return (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditingMemberId(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setEditingMemberId(m.id);
                    }
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.8fr 1fr 80px',
                    padding: '12px 18px',
                    alignItems: 'center',
                    borderBottom:
                      i < members.length - 1 || pagination.totalCount > pagination.pageSize
                        ? '1px solid var(--hof-border)'
                        : 'none',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 13,
                    color: 'var(--hof-text)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hof-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar initials={initials} src={m.avatarUrl} alt={m.name} size={28} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                      >
                        <span style={{ fontWeight: 500 }}>{m.name}</span>
                        {m.role === 'crew' && (
                          <Pill tone="crew" size="sm">
                            Crew
                          </Pill>
                        )}
                        {m.flag === 'flagged' && (
                          <Pill tone="danger" size="sm">
                            Flagged
                          </Pill>
                        )}
                        {m.flag === 'new' && (
                          <Pill tone="amber" size="sm">
                            New
                          </Pill>
                        )}
                        {m.flag === 'photographer' && (
                          <Pill tone="gold" size="sm">
                            Photo
                          </Pill>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 10,
                          color: 'var(--hof-text-dis)',
                        }}
                      >
                        Joined {m.joined}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      color: 'var(--hof-text-sec)',
                      fontSize: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.email}
                  </div>
                  <div>
                    <Pill
                      tone={m.tier === 'VIP' || m.tier === 'Owner' ? 'gold' : 'neutral'}
                      size="sm"
                    >
                      {m.tier}
                    </Pill>
                  </div>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {m.editions}
                  </div>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                      color: 'var(--hof-text-sec)',
                    }}
                  >
                    {m.lastSeen}
                  </div>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {m.posts}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      fontFamily: 'Inter, system-ui',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--hof-text-sec)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Edit
                  </div>
                </div>
              );
            })}
          {!loading && !error && members.length === 0 && (
            <div style={{ padding: 18, color: 'var(--hof-text-sec)', fontSize: 13 }}>
              No members match your search.
            </div>
          )}
          </div>
          </div>
          <TablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.totalCount}
            onPageChange={setPage}
          />
        </div>
      </div>

      <MemberEditModal
        open={editingMemberId !== null}
        memberId={editingMemberId}
        onClose={() => setEditingMemberId(null)}
        onSaved={() => {
          void loadMembers();
          setToast({ kind: 'success', message: 'Member updated' });
        }}
      />

      {toast ? (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 300 }}>
          <HofToast kind={toast.kind} onDismiss={() => setToast(null)}>
            {toast.message}
          </HofToast>
        </div>
      ) : null}
    </>
  );
}
