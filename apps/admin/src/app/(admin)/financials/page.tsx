'use client';

import { useCallback, useEffect, useState } from 'react';
import { Kpi } from '@/components/Kpi';
import { PaneHeader } from '@/components/PaneHeader';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@/components/TablePagination';
import type { ApiPagination } from '@/lib/pagination';

interface FinancialRow {
  event_id: string;
  edition_number: number;
  name: string;
  date: string;
  status: string;
  gross_cents: number;
  ticket_count: number;
}

interface EditionBar {
  edition: number;
  gross: number;
  active?: boolean;
}

interface RefundRow {
  id: string;
  reason: string | null;
  status: string;
  created_at: string;
  tickets: { code: string; amount_cents: number } | null;
  profiles: { display_name: string; handle: string } | null;
}

export default function FinancialsPage() {
  const [financials, setFinancials] = useState<FinancialRow[]>([]);
  const [totals, setTotals] = useState({ gross_cents: 0, ticket_count: 0 });
  const [pagination, setPagination] = useState<ApiPagination>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [pendingRefunds, setPendingRefunds] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinancials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(DEFAULT_PAGE_SIZE));

      const [finRes, refRes] = await Promise.all([
        fetch(`/api/admin/financials?${params}`),
        fetch('/api/admin/refunds'),
      ]);
      const data = (await finRes.json()) as {
        financials?: FinancialRow[];
        totals?: { gross_cents: number; ticket_count: number };
        pagination?: ApiPagination;
        error?: string;
      };
      const refData = (await refRes.json()) as { pending?: RefundRow[]; error?: string };
      if (data.error) {
        setError(data.error);
      } else {
        setFinancials(data.financials ?? []);
        setTotals(data.totals ?? { gross_cents: 0, ticket_count: 0 });
        if (data.pagination) setPagination(data.pagination);
        setError(null);
      }
      setPendingRefunds(refData.pending ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financials');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadFinancials();
  }, [loadFinancials]);

  async function handleRefundAction(id: string, status: 'approved' | 'rejected') {
    await fetch('/api/admin/refunds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setPendingRefunds((prev) => prev.filter((r) => r.id !== id));
  }

  // Use last 6 editions for the bar chart
  const sorted = [...financials].sort((a, b) => a.edition_number - b.edition_number);
  const lastSix = sorted.slice(-6);

  // Most recent (active) edition is the last one
  const activeEdition = lastSix[lastSix.length - 1];

  const editionBars: EditionBar[] = lastSix.map((f) => ({
    edition: f.edition_number,
    gross: f.gross_cents / 100,
    active: f.edition_number === activeEdition?.edition_number,
  }));

  const maxGross =
    editionBars.length > 0 ? Math.max(...editionBars.map((b) => b.gross), 1000) : 8000;

  const totalGross = `$${(totals.gross_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const activeGrossCents = activeEdition?.gross_cents ?? 0;
  const activeGross = `$${(activeGrossCents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const activeEditionLabel = activeEdition
    ? `Theme ${activeEdition.edition_number}`
    : 'Latest theme';

  // Breakdown rows — one per edition in the chart
  const breakdownColors = [
    'var(--hof-amber)',
    'var(--hof-glow)',
    'var(--hof-gold)',
    'var(--hof-border-hi)',
    'var(--hof-info)',
    'var(--hof-success)',
  ];

  return (
    <>
      <PaneHeader
        eyebrow="Admin"
        title="Financials"
        sub="Money in, money out. Per theme and rolling."
        cta={
          <button
            type="button"
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--hof-border)',
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--hof-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 15 v4 a2 2 0 0 1-2 2 H5 a2 2 0 0 1-2-2 v-4 M7 10 l5 5 5-5 M12 15 V3"
              />
            </svg>
            Export
          </button>
        }
      />

      {/* KPI strip */}
      <div style={{ padding: '20px 28px 0' }}>
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
            Error: {error}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi
            label={`${activeEditionLabel} gross`}
            value={loading ? '…' : activeGross}
            delta="Current event"
            tone="amber"
          />
          <Kpi
            label="Ticket count"
            value={loading ? '…' : String(activeEdition?.ticket_count ?? 0)}
            delta="Valid + used tickets"
            tone="neutral"
          />
          <Kpi
            label="Total gross all themes"
            value={loading ? '…' : totalGross}
            delta="All time"
            tone="amber"
          />
          <Kpi
            label="Open refund req."
            value={String(pendingRefunds.length)}
            delta={pendingRefunds.length === 0 ? 'No pending refunds' : 'Awaiting review'}
            tone="warning"
          />
        </div>
      </div>

      {/* Charts */}
      <div
        style={{
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 16,
        }}
      >
        {/* By-edition bar chart */}
        <div
          style={{
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              color: 'var(--hof-text-sec)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            By theme · last 6
          </div>
          <div
            style={{
              fontFamily: 'Clash Display, system-ui',
              fontWeight: 600,
              fontSize: 18,
              color: 'var(--hof-text)',
              marginTop: 4,
            }}
          >
            {loading ? 'Loading…' : 'Steady right-up-and-to-the-right'}
          </div>

          <div
            style={{
              marginTop: 18,
              display: 'flex',
              gap: 14,
              alignItems: 'flex-end',
              height: 180,
            }}
          >
            {loading && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  color: 'var(--hof-text-sec)',
                }}
              >
                Loading…
              </div>
            )}
            {!loading &&
              editionBars.map((b) => {
                const heightPct = (b.gross / maxGross) * 100;
                return (
                  <div
                    key={b.edition}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: b.active
                          ? 'linear-gradient(180deg, var(--hof-amber), var(--hof-ember))'
                          : 'linear-gradient(180deg, #3a3835, #2a2826)',
                        borderRadius: '4px 4px 0 0',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        paddingTop: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 10,
                          color: b.active ? 'var(--hof-bg)' : 'var(--hof-text)',
                          fontWeight: 600,
                        }}
                      >
                        {`$${(b.gross / 1000).toFixed(1)}k`}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: 'Inter, system-ui',
                        fontSize: 10,
                        color: 'var(--hof-text-sec)',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Th {b.edition}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Theme breakdown */}
        <div
          style={{
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              color: 'var(--hof-text-sec)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            Theme breakdown
          </div>

          {loading && (
            <div
              style={{
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: 'var(--hof-text-sec)',
              }}
            >
              Loading…
            </div>
          )}
          {!loading &&
            lastSix.map((f, idx) => {
              const gross = f.gross_cents / 100;
              const pct = maxGross > 0 ? (gross / maxGross) * 100 : 0;
              const color = breakdownColors[idx] ?? 'var(--hof-amber)';
              const value = `$${gross.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

              return (
                <div key={f.event_id} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      fontFamily: 'Inter, system-ui',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: 'var(--hof-text)', fontWeight: 500 }}>
                      Th {f.edition_number} × {f.ticket_count}
                    </span>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        color: 'var(--hof-text)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {value}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      height: 5,
                      background: 'var(--hof-elevated)',
                      borderRadius: 3,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct * 1.7}%`,
                        background: color,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              );
            })}

          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--hof-border)',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'Inter, system-ui',
              fontSize: 14,
              color: 'var(--hof-text)',
              fontWeight: 500,
            }}
          >
            <span>Total gross</span>
            <span
              style={{
                fontFamily: 'Clash Display, system-ui',
                fontWeight: 600,
                fontSize: 18,
                color: 'var(--hof-amber)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {loading ? '…' : totalGross}
            </span>
          </div>

          <TablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.totalCount}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Refund queue */}
      <div style={{ padding: '0 28px 28px' }}>
        <div
          style={{
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
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
                Refund requests
              </div>
              <div
                style={{
                  fontFamily: 'Clash Display, system-ui',
                  fontWeight: 600,
                  fontSize: 18,
                  color: 'var(--hof-text)',
                  marginTop: 4,
                }}
              >
                {pendingRefunds.length} pending
              </div>
            </div>
          </div>

          {pendingRefunds.length === 0 ? (
            <div
              style={{
                padding: '16px',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: 'var(--hof-text-sec)',
                textAlign: 'center',
              }}
            >
              No pending refund requests.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingRefunds.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: 12,
                    background: 'var(--hof-bg)',
                    border: '1px solid var(--hof-border)',
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Inter, system-ui',
                      fontSize: 13,
                      color: 'var(--hof-text)',
                    }}
                  >
                    {r.profiles?.display_name ?? r.profiles?.handle ?? 'Member'} ·{' '}
                    {r.tickets?.code ?? 'ticket'}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter, system-ui',
                      fontSize: 11,
                      color: 'var(--hof-text-sec)',
                      marginTop: 4,
                    }}
                  >
                    {r.reason ?? 'No reason given'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => void handleRefundAction(r.id, 'approved')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: 'var(--hof-success)',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'Inter, system-ui',
                        fontSize: 12,
                        color: 'var(--hof-bg)',
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRefundAction(r.id, 'rejected')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: 'transparent',
                        border: '1px solid var(--hof-border)',
                        cursor: 'pointer',
                        fontFamily: 'Inter, system-ui',
                        fontSize: 12,
                        color: 'var(--hof-text-sec)',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
