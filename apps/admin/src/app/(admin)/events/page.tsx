'use client';

import { useState } from 'react';
import { PaneHeader } from '@/components/PaneHeader';
import { Pill } from '@/components/Pill';

type EventStatus = 'live' | 'draft' | 'past';
type FilterKey = 'all' | EventStatus;

interface EventRow {
  ed: number;
  name: string;
  date: string;
  status: EventStatus;
  sold: number;
  cap: number;
  gross: string;
}

const EVENTS: EventRow[] = [
  {
    ed: 24,
    name: 'Fireversary',
    date: 'Jun 26, 2026',
    status: 'live',
    sold: 253,
    cap: 300,
    gross: '$7,684',
  },
  {
    ed: 25,
    name: 'Mid-Summer Burn',
    date: 'Jul 24, 2026',
    status: 'draft',
    sold: 0,
    cap: 300,
    gross: '—',
  },
  {
    ed: 23,
    name: 'Late Bloom',
    date: 'May 30, 2026',
    status: 'past',
    sold: 300,
    cap: 300,
    gross: '$8,940',
  },
  {
    ed: 22,
    name: 'Slow Burn',
    date: 'Apr 25, 2026',
    status: 'past',
    sold: 300,
    cap: 300,
    gross: '$8,940',
  },
  {
    ed: 21,
    name: 'The Equinox',
    date: 'Mar 28, 2026',
    status: 'past',
    sold: 286,
    cap: 300,
    gross: '$8,512',
  },
  {
    ed: 20,
    name: 'Year Two Open',
    date: 'Feb 28, 2026',
    status: 'past',
    sold: 300,
    cap: 300,
    gross: '$8,400',
  },
];

const FILTERS: Array<[FilterKey, string]> = [
  ['all', 'All'],
  ['live', 'Live'],
  ['draft', 'Drafts'],
  ['past', 'Past'],
];

export default function EventsPage() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const filtered = filter === 'all' ? EVENTS : EVENTS.filter((e) => e.status === filter);

  return (
    <>
      <PaneHeader
        eyebrow="Events"
        title="All editions"
        sub="24 editions to date · 1 draft · 1 live"
        cta={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
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
          {filtered.map((e, i) => (
            <div
              key={e.ed}
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
                      background: e.status === 'live' ? 'var(--hof-amber)' : 'var(--hof-border-hi)',
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
