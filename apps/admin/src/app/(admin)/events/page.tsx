'use client';

import { useCallback, useEffect, useState } from 'react';
import { PaneHeader } from '@/components/PaneHeader';
import { Pill } from '@/components/Pill';
import { type EventRow, mapEventRow } from '@/lib/mapEventRow';

type EventStatus = 'live' | 'draft' | 'past';
type FilterKey = 'all' | EventStatus;

const FILTERS: Array<[FilterKey, string]> = [
  ['all', 'All'],
  ['live', 'Live'],
  ['draft', 'Drafts'],
  ['past', 'Past'],
];

export default function EventsPage() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/events?includeStats=1');
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to load events');
      }
      const data = (await res.json()) as { events: Parameters<typeof mapEventRow>[0][] };
      setEvents((data.events ?? []).map(mapEventRow));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = filter === 'all' ? events : events.filter((e) => e.status === filter);
  const liveCount = events.filter((e) => e.status === 'live').length;
  const draftCount = events.filter((e) => e.status === 'draft').length;
  const sub =
    events.length > 0
      ? `${events.length} editions to date · ${draftCount} draft${draftCount === 1 ? '' : 's'} · ${liveCount} live`
      : loading
        ? 'Loading editions…'
        : (error ?? 'No editions');

  async function duplicateLast() {
    const last = [...events].sort((a, b) => b.ed - a.ed)[0];
    if (!last) return;
    await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duplicateFromId: last.id }),
    });
    void load();
  }

  async function createEdition() {
    const maxEd = events.reduce((m, e) => Math.max(m, e.ed), 0);
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New edition',
        edition_number: maxEd + 1,
        date: nextDate.toISOString().slice(0, 10),
        venue_name: 'Junkyard Social Club',
        venue_address: 'Boulder, CO',
        capacity: 300,
      }),
    });
    void load();
  }

  return (
    <>
      <PaneHeader
        eyebrow="Events"
        title="All editions"
        sub={sub}
        cta={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => void duplicateLast()}
              style={{
                padding: '9px 14px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid var(--hof-border)',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--hof-text)',
              }}
            >
              Duplicate last edition
            </button>
            <button
              type="button"
              onClick={() => void createEdition()}
              style={{
                padding: '9px 14px',
                borderRadius: 8,
                background: 'var(--hof-amber)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--hof-bg)',
              }}
            >
              + New edition
            </button>
          </div>
        }
      />

      {/* Filter tabs */}
      <div style={{ padding: '16px 28px 0', display: 'flex', gap: 4 }}>
        {FILTERS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              background: filter === k ? 'var(--hof-elevated)' : 'transparent',
              border: filter === k ? '1px solid var(--hof-border)' : '1px solid transparent',
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              fontWeight: 500,
              color: filter === k ? 'var(--hof-text)' : 'var(--hof-text-sec)',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding: '14px 28px 28px' }}>
        <div
          style={{
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '60px 2fr 1fr 0.7fr 1.2fr 1fr 80px',
              padding: '12px 18px',
              borderBottom: '1px solid var(--hof-border)',
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              color: 'var(--hof-text-sec)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            <div>Ed</div>
            <div>Name</div>
            <div>Date</div>
            <div>Status</div>
            <div>Sold</div>
            <div>Gross</div>
            <div />
          </div>
          {loading && (
            <div
              style={{
                padding: '24px 18px',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: 'var(--hof-text-sec)',
              }}
            >
              Loading editions…
            </div>
          )}
          {!loading && error && (
            <div
              style={{
                padding: '24px 18px',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: 'var(--hof-text-sec)',
              }}
            >
              {error}
            </div>
          )}
          {!loading &&
            !error &&
            filtered.map((e, i) => (
              <div
                key={e.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 2fr 1fr 0.7fr 1.2fr 1fr 80px',
                  padding: '14px 18px',
                  alignItems: 'center',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--hof-border)' : 'none',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  color: 'var(--hof-text)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Clash Display, system-ui',
                    fontWeight: 600,
                    fontSize: 18,
                    color: 'var(--hof-text)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {e.ed}
                </div>
                <div style={{ fontFamily: 'Inter, system-ui', fontWeight: 500 }}>{e.name}</div>
                <div
                  style={{
                    color: 'var(--hof-text-sec)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                  }}
                >
                  {e.date}
                </div>
                <div>
                  <Pill
                    tone={
                      e.status === 'live' ? 'amber' : e.status === 'draft' ? 'neutral' : 'success'
                    }
                    size="sm"
                  >
                    {e.status}
                  </Pill>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                      color: 'var(--hof-text)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {e.sold} / {e.cap}
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: 'var(--hof-elevated)',
                      borderRadius: 2,
                      marginTop: 4,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(e.sold / e.cap) * 100}%`,
                        background:
                          e.status === 'live' ? 'var(--hof-amber)' : 'var(--hof-border-hi)',
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 13,
                    color: 'var(--hof-text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {e.gross}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      stroke="var(--hof-text-sec)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 6 L15 12 L9 18"
                    />
                  </svg>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
