'use client';

import { useCallback, useEffect, useState } from 'react';
import { EventFormModal, parseFaqsFromJson } from '@/components/EventFormModal';
import { PaneHeader } from '@/components/PaneHeader';
import type { EventFormPayload, EventStatus } from '@/lib/eventPayload';
import type { TierFormRow } from '@/lib/tierPayload';
import { useEventsRealtime } from '@/hooks/useEventsRealtime';
import { type EventRow, mapEventRow, mapEventStatus } from '@/lib/mapEventRow';

type EventStatus = 'live' | 'draft' | 'past';
type FilterKey = 'all' | EventStatus;

const FILTERS: Array<[FilterKey, string]> = [
  ['all', 'All'],
  ['live', 'Live'],
  ['draft', 'Drafts'],
  ['past', 'Past'],
];

const STATUS_OPTIONS: Array<{ value: EventStatus; label: string }> = [
  { value: 'upcoming', label: 'Draft' },
  { value: 'live', label: 'Live' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

function eventToForm(ev: {
  edition_number: number;
  name: string;
  tagline: string | null;
  date: string;
  doors_open: string;
  doors_close: string;
  venue_name: string;
  venue_address: string;
  venue_lat: number | null;
  venue_lng: number | null;
  capacity: number;
  max_tickets_per_user?: number;
  status: EventFormPayload['status'];
  visibility?: EventFormPayload['visibility'];
  dress_code?: string | null;
  hero_image_url: string | null;
  faqs: unknown;
}): EventFormPayload {
  return {
    edition_number: ev.edition_number,
    name: ev.name,
    tagline: ev.tagline,
    date: ev.date,
    doors_open: ev.doors_open.slice(0, 5),
    doors_close: ev.doors_close.slice(0, 5),
    venue_name: ev.venue_name,
    venue_address: ev.venue_address,
    venue_lat: ev.venue_lat,
    venue_lng: ev.venue_lng,
    capacity: ev.capacity,
    max_tickets_per_user: ev.max_tickets_per_user ?? 4,
    status: ev.status,
    visibility: ev.visibility ?? 'public',
    dress_code: ev.dress_code ?? null,
    hero_image_url: ev.hero_image_url,
    faqs: parseFaqsFromJson(ev.faqs),
  };
}

export default function EventsPage() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editEventId, setEditEventId] = useState<string | undefined>();
  const [formInitial, setFormInitial] = useState<Partial<EventFormPayload>>({});
  const [initialTiers, setInitialTiers] = useState<TierFormRow[]>([]);
  const [soldByTierId, setSoldByTierId] = useState<Record<string, number>>({});
  const [editSold, setEditSold] = useState(0);
  const [openingEdit, setOpeningEdit] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  useEventsRealtime({
    onEventUpdate: (row) => {
      const rawStatus = row.status;
      setEvents((prev) =>
        prev.map((e) =>
          e.id === row.id
            ? {
                ...e,
                rawStatus,
                status: mapEventStatus(rawStatus),
              }
            : e,
        ),
      );
    },
  });

  const filtered = filter === 'all' ? events : events.filter((e) => e.status === filter);
  const liveCount = events.filter((e) => e.status === 'live').length;
  const liveEventId = events.find((e) => e.rawStatus === 'live')?.id ?? null;
  const draftCount = events.filter((e) => e.status === 'draft').length;
  const sub =
    events.length > 0
      ? `${events.length} themes to date · ${draftCount} draft${draftCount === 1 ? '' : 's'} · ${liveCount} live`
      : loading
        ? 'Loading themes…'
        : (error ?? 'No themes');

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

  function openCreateModal() {
    const maxEd = events.reduce((m, e) => Math.max(m, e.ed), 0);
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    setModalMode('create');
    setEditEventId(undefined);
    setEditSold(0);
    setSoldByTierId({});
    setFormInitial({
      edition_number: maxEd + 1,
      name: '',
      date: nextDate.toISOString().slice(0, 10),
      venue_name: 'Junkyard Social Club',
      venue_address: 'Boulder, CO',
      capacity: 0,
      max_tickets_per_user: 4,
      status: 'upcoming',
      doors_open: '20:00',
      doors_close: '02:00',
      faqs: [],
    });
    setInitialTiers([
      {
        display_name: 'Early Bird',
        name: 'early',
        description: 'Inclusive of fees',
        price_cents: 2000,
        fee_cents: 140,
        capacity: 80,
        status: 'available',
        sort_order: 0,
      },
      {
        display_name: 'General',
        name: 'ga',
        description: 'Inclusive of fees',
        price_cents: 2800,
        fee_cents: 196,
        capacity: 180,
        status: 'available',
        sort_order: 1,
      },
      {
        display_name: 'VIP',
        name: 'vip',
        description: 'Inclusive of fees',
        price_cents: 5500,
        fee_cents: 385,
        capacity: 40,
        status: 'available',
        sort_order: 2,
      },
    ]);
    setModalOpen(true);
  }

  async function openEditModal(id: string) {
    setOpeningEdit(id);
    try {
      const res = await fetch(`/api/admin/events/${id}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        event: Parameters<typeof eventToForm>[0];
        sold: number;
        tiers?: Array<{
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          price_cents: number;
          fee_cents?: number;
          capacity: number;
          status: TierFormRow['status'];
          sort_order: number;
          sold?: number;
        }>;
      };
      setModalMode('edit');
      setEditEventId(id);
      setEditSold(data.sold ?? 0);
      setFormInitial(eventToForm(data.event));
      const soldMap: Record<string, number> = {};
      setInitialTiers(
        (data.tiers ?? []).map((t) => {
          if (t.sold) soldMap[t.id] = t.sold;
          return {
            id: t.id,
            name: t.name,
            display_name: t.display_name,
            description: t.description,
            price_cents: t.price_cents,
            fee_cents: t.fee_cents ?? 0,
            capacity: t.capacity,
            status: t.status,
            sort_order: t.sort_order,
          };
        }),
      );
      setSoldByTierId(soldMap);
      setModalOpen(true);
    } finally {
      setOpeningEdit(null);
    }
  }

  async function updateEventStatus(
    eventId: string,
    nextStatus: EventStatus,
    previousStatus: EventStatus,
  ) {
    if (nextStatus === previousStatus) return;

    setStatusUpdating(eventId);
    setStatusMessage(null);
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, rawStatus: nextStatus, status: mapEventStatus(nextStatus) } : e,
      ),
    );

    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, rawStatus: previousStatus, status: mapEventStatus(previousStatus) }
              : e,
          ),
        );
        setStatusMessage(data.error ?? 'Failed to update status');
        return;
      }
      void load();
    } catch {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, rawStatus: previousStatus, status: mapEventStatus(previousStatus) }
            : e,
        ),
      );
      setStatusMessage('Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  }

  return (
    <>
      <PaneHeader
        eyebrow="Events"
        title="All themes"
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
              Duplicate last theme
            </button>
            <button
              type="button"
              onClick={openCreateModal}
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
              + New theme
            </button>
          </div>
        }
      />

      {/* Filter tabs */}
      <div className="hof-admin-pad-section" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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

      {statusMessage && (
        <div
          style={{
            margin: '0 28px',
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            fontFamily: 'Inter, system-ui',
            fontSize: 13,
            color: 'var(--hof-text)',
          }}
        >
          {statusMessage}
        </div>
      )}

      <div className="hof-admin-pad-section-bottom">
        <div
          style={{
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div className="hof-admin-table-scroll">
          <div className="hof-admin-data-table hof-admin-data-table--lg">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '60px 2fr 1fr 1.1fr 1.2fr 1fr 80px',
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
              Loading themes…
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
                role="button"
                tabIndex={0}
                onClick={() => void openEditModal(e.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    void openEditModal(e.id);
                  }
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 2fr 1fr 1.1fr 1.2fr 1fr 80px',
                  padding: '14px 18px',
                  alignItems: 'center',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--hof-border)' : 'none',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  color: 'var(--hof-text)',
                  cursor: openingEdit === e.id ? 'wait' : 'pointer',
                  opacity: openingEdit === e.id ? 0.6 : 1,
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
                <div
                  onClick={(ev) => ev.stopPropagation()}
                  onKeyDown={(ev) => ev.stopPropagation()}
                >
                  <select
                    value={e.rawStatus}
                    disabled={statusUpdating === e.id}
                    onChange={(ev) => {
                      void updateEventStatus(e.id, ev.target.value as EventStatus, e.rawStatus);
                    }}
                    style={{
                      width: '100%',
                      maxWidth: 132,
                      height: 30,
                      padding: '0 8px',
                      borderRadius: 6,
                      border: '1px solid var(--hof-border)',
                      background: 'var(--hof-bg)',
                      fontFamily: 'Inter, system-ui',
                      fontSize: 12,
                      fontWeight: 500,
                      color:
                        e.rawStatus === 'live'
                          ? 'var(--hof-amber)'
                          : e.rawStatus === 'upcoming'
                            ? 'var(--hof-text-sec)'
                            : 'var(--hof-text)',
                      cursor: statusUpdating === e.id ? 'wait' : 'pointer',
                      opacity: statusUpdating === e.id ? 0.6 : 1,
                    }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={
                          opt.value === 'live' && liveEventId != null && liveEventId !== e.id
                        }
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
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
        </div>
      </div>

      <EventFormModal
        open={modalOpen}
        mode={modalMode}
        eventId={editEventId}
        liveEventId={liveEventId}
        initial={formInitial}
        initialTiers={initialTiers}
        soldByTierId={soldByTierId}
        sold={editSold}
        onClose={() => setModalOpen(false)}
        onSaved={() => void load()}
        onDeleted={() => void load()}
      />
    </>
  );
}
