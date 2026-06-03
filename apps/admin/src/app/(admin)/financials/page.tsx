'use client';

import { useEffect, useState } from 'react';
import { Kpi } from '@/components/Kpi';
import { PaneHeader } from '@/components/PaneHeader';

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

export default function FinancialsPage() {
  const [financials, setFinancials] = useState<FinancialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/financials');
        const data = (await res.json()) as { financials?: FinancialRow[]; error?: string };
        if (data.error) {
          setError(data.error);
        } else {
          setFinancials(data.financials ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load financials');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

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

  // Total revenue across all editions
  const totalGrossCents = financials.reduce((sum, f) => sum + f.gross_cents, 0);
  const totalGross = `$${(totalGrossCents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const activeGrossCents = activeEdition?.gross_cents ?? 0;
  const activeGross = `$${(activeGrossCents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const activeEditionLabel = activeEdition
    ? `Edition ${activeEdition.edition_number}`
    : 'Latest edition';

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
        sub="Money in, money out. Per edition and rolling."
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
            label="Total gross all editions"
            value={loading ? '…' : totalGross}
            delta="All time"
            tone="amber"
          />
          <Kpi label="Open refund req." value="0" delta="No pending refunds" tone="warning" />
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
            By edition · last 6
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
                      Ed {b.edition}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Edition breakdown */}
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
            Edition breakdown
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
                      Ed {f.edition_number} × {f.ticket_count}
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
                0 pending
              </div>
            </div>
          </div>

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
        </div>
      </div>
    </>
  );
}
