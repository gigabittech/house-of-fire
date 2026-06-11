'use client';

import type { CSSProperties } from 'react';

export type GuestFilterState = {
  eventId: string;
  tierId: string;
  email: string;
  code: string;
  nameSearch: string;
};

export type TierOption = { id: string; label: string; tierIds?: string[] };

export type EventOption = {
  id: string;
  edition_number: number;
  name: string;
  status: string;
};

interface GuestFiltersProps {
  events: EventOption[];
  tiers: TierOption[];
  filters: GuestFilterState;
  onChange: (next: GuestFilterState) => void;
  onExportCsv?: () => void;
}

const labelStyle: CSSProperties = {
  fontFamily: 'Inter, system-ui',
  fontSize: 10,
  color: 'var(--hof-text-sec)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  border: '1px solid var(--hof-border)',
  background: 'var(--hof-elevated)',
  borderRadius: 8,
  padding: '8px 10px',
  fontFamily: 'Inter, system-ui',
  fontSize: 12,
  color: 'var(--hof-text)',
  width: '100%',
  outline: 'none',
};

export function GuestFilters({ events, tiers, filters, onChange, onExportCsv }: GuestFiltersProps) {
  const set = (patch: Partial<GuestFilterState>) => onChange({ ...filters, ...patch });

  return (
    <div
      style={{
        padding: '16px 28px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'flex-end',
      }}
    >
      <div style={{ minWidth: 180, flex: '1 1 160px' }}>
        <div style={labelStyle}>Event</div>
        <select
          value={filters.eventId}
          onChange={(e) => set({ eventId: e.target.value, tierId: '' })}
          style={inputStyle}
        >
          <option value="">All editions</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              Edition {ev.edition_number} · {ev.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ minWidth: 140, flex: '1 1 120px' }}>
        <div style={labelStyle}>Ticket tier</div>
        <select
          value={filters.tierId}
          onChange={(e) => set({ tierId: e.target.value })}
          style={inputStyle}
          disabled={tiers.length === 0}
        >
          <option value="">All tiers</option>
          {tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ minWidth: 160, flex: '1 1 140px' }}>
        <div style={labelStyle}>Email</div>
        <input
          type="text"
          placeholder="Filter by email…"
          value={filters.email}
          onChange={(e) => set({ email: e.target.value })}
          style={inputStyle}
        />
      </div>

      <div style={{ minWidth: 140, flex: '1 1 120px' }}>
        <div style={labelStyle}>Ticket ID</div>
        <input
          type="text"
          placeholder="e.g. HOF-24-0001"
          value={filters.code}
          onChange={(e) => set({ code: e.target.value })}
          style={{
            ...inputStyle,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        />
      </div>

      <div style={{ minWidth: 140, flex: '1 1 120px' }}>
        <div style={labelStyle}>Name</div>
        <input
          type="text"
          placeholder="Quick search…"
          value={filters.nameSearch}
          onChange={(e) => set({ nameSearch: e.target.value })}
          style={inputStyle}
        />
      </div>

      {onExportCsv && (
        <button
          type="button"
          onClick={onExportCsv}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--hof-border)',
            background: 'var(--hof-surface)',
            fontFamily: 'Inter, system-ui',
            fontSize: 12,
            color: 'var(--hof-text)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Export CSV
        </button>
      )}
    </div>
  );
}
