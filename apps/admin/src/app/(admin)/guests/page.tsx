'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EventGuestSection } from '@/components/EventGuestSection';
import {
  GuestFilters,
  type EventOption,
  type GuestFilterState,
  type TierOption,
} from '@/components/GuestFilters';
import {
  GuestTierStatus,
  type EventTierStatusGroup,
} from '@/components/GuestTierStatus';
import { TicketDetailPanel } from '@/components/TicketDetailPanel';
import {
  groupTicketsByEvent,
  guestDisplayName,
  guestEmail,
  guestTierLabel,
  normalizeGuestTicket,
  receiptForTicket,
  type AdminGuestTicket,
} from '@/lib/guestTicket';

const defaultFilters: GuestFilterState = {
  eventId: '',
  tierId: '',
  email: '',
  code: '',
  nameSearch: '',
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function GuestsPage() {
  const [filters, setFilters] = useState<GuestFilterState>(defaultFilters);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [tierOptions, setTierOptions] = useState<TierOption[]>([]);
  const [tickets, setTickets] = useState<AdminGuestTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<AdminGuestTicket | null>(null);
  const [tierStatus, setTierStatus] = useState<EventTierStatusGroup[]>([]);
  const [tierStatusLoading, setTierStatusLoading] = useState(true);
  const [pagesByEvent, setPagesByEvent] = useState<Record<string, number>>({});

  const debouncedEmail = useDebouncedValue(filters.email, 400);
  const debouncedCode = useDebouncedValue(filters.code, 400);
  const defaultEventApplied = useRef(false);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/admin/events');
        const data = (await res.json()) as { events?: EventOption[]; error?: string };
        if (!data.error && data.events) {
          const mapped = data.events.map((e) => ({
            id: e.id,
            edition_number: e.edition_number,
            name: e.name,
            status: e.status,
          }));
          setEvents(mapped);

          if (!defaultEventApplied.current) {
            const live = mapped.find((e) => e.status === 'live');
            if (live) {
              setFilters((prev) => ({ ...prev, eventId: live.id }));
            }
            defaultEventApplied.current = true;
          }
        }
      } catch {
        /* keep empty */
      }
    }
    void loadEvents();
  }, []);

  useEffect(() => {
    async function loadTiers() {
      if (filters.eventId) {
        try {
          const res = await fetch(`/api/admin/events/${filters.eventId}/tiers`);
          const data = (await res.json()) as {
            tiers?: Array<{ id: string; display_name: string; name: string }>;
          };
          setTierOptions(
            (data.tiers ?? []).map((t) => ({
              id: t.id,
              label: t.display_name || t.name,
            })),
          );
        } catch {
          setTierOptions([]);
        }
        return;
      }
      const seen = new Map<string, string>();
      for (const t of tickets) {
        if (t.ticket_tiers?.id) {
          seen.set(t.ticket_tiers.id, t.ticket_tiers.display_name || t.ticket_tiers.name);
        }
      }
      setTierOptions([...seen.entries()].map(([id, label]) => ({ id, label })));
    }
    void loadTiers();
  }, [filters.eventId, tickets]);

  const loadGuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.eventId) params.set('eventId', filters.eventId);
      if (filters.tierId) params.set('tierId', filters.tierId);
      if (debouncedEmail) params.set('email', debouncedEmail);
      if (debouncedCode) params.set('code', debouncedCode);
      const qs = params.toString();
      const res = await fetch(`/api/admin/guests${qs ? `?${qs}` : ''}`);
      const data = (await res.json()) as { guests?: unknown[]; error?: string };
      if (data.error) {
        setError(data.error);
        setTickets([]);
      } else {
        setTickets((data.guests ?? []).map((row) => normalizeGuestTicket(row as Record<string, unknown>)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load guests');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filters.eventId, filters.tierId, debouncedEmail, debouncedCode]);

  useEffect(() => {
    void loadGuests();
  }, [loadGuests]);

  useEffect(() => {
    setPagesByEvent({});
  }, [filters.eventId, filters.tierId, debouncedEmail, debouncedCode, filters.nameSearch]);

  useEffect(() => {
    async function loadTierStatus() {
      setTierStatusLoading(true);
      try {
        const params = filters.eventId ? `?eventId=${filters.eventId}` : '';
        const res = await fetch(`/api/admin/guests/status${params}`);
        const data = (await res.json()) as {
          events?: EventTierStatusGroup[];
          error?: string;
        };
        if (!data.error && data.events) {
          setTierStatus(data.events);
        } else {
          setTierStatus([]);
        }
      } catch {
        setTierStatus([]);
      } finally {
        setTierStatusLoading(false);
      }
    }
    void loadTierStatus();
  }, [filters.eventId]);

  const tierStatusScopeLabel = useMemo(() => {
    if (filters.eventId) {
      const ev = events.find((e) => e.id === filters.eventId);
      if (ev) return `${ev.name} · Edition ${ev.edition_number}`;
    }
    return 'All editions';
  }, [filters.eventId, events]);

  const nameQuery = filters.nameSearch.trim().toLowerCase();
  const filteredTickets = useMemo(() => {
    if (!nameQuery) return tickets;
    return tickets.filter((t) => {
      const name = guestDisplayName(t).toLowerCase();
      const email = guestEmail(t).toLowerCase();
      return name.includes(nameQuery) || email.includes(nameQuery);
    });
  }, [tickets, nameQuery]);

  const groups = useMemo(() => groupTicketsByEvent(filteredTickets), [filteredTickets]);

  const defaultExpandedEventId = useMemo(() => {
    const live = groups.find((g) => g.event.status === 'live');
    if (live) return live.event.id;
    const upcoming = groups.find((g) => g.event.status === 'upcoming');
    if (upcoming) return upcoming.event.id;
    return groups[0]?.event.id ?? null;
  }, [groups]);

  const subtitle = useMemo(() => {
    if (filters.eventId) {
      const ev = events.find((e) => e.id === filters.eventId);
      if (ev) {
        return `${ev.name} · Edition ${ev.edition_number} · ${filteredTickets.length} ticket${filteredTickets.length === 1 ? '' : 's'}`;
      }
    }
    const eventCount = groups.length;
    return `All editions · ${filteredTickets.length} ticket${filteredTickets.length === 1 ? '' : 's'} across ${eventCount} event${eventCount === 1 ? '' : 's'}`;
  }, [filters.eventId, events, filteredTickets.length, groups.length]);

  function exportCsv() {
    const header = [
      'code',
      'name',
      'email',
      'tier',
      'status',
      'event_edition',
      'purchased_at',
      'amount_cents',
      'receipt_total_cents',
    ];
    const rows = filteredTickets.map((t) => {
      const receipt = receiptForTicket(t, filteredTickets);
      return [
        t.code,
        guestDisplayName(t),
        guestEmail(t),
        guestTierLabel(t),
        t.status,
        String(t.events?.edition_number ?? ''),
        t.purchased_at,
        String(t.amount_cents),
        String(receipt.total),
      ];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div
        style={{
          padding: '22px 28px 18px',
          borderBottom: '1px solid var(--hof-border)',
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
          Guest list
        </div>
        <div
          style={{
            fontFamily: 'Clash Display, system-ui',
            fontWeight: 600,
            fontSize: 26,
            color: 'var(--hof-text)',
            letterSpacing: '-0.01em',
            marginTop: 4,
          }}
        >
          {loading ? 'Loading…' : `${filteredTickets.length} confirmed`}
        </div>
        <div
          style={{
            fontFamily: 'Inter, system-ui',
            fontSize: 12,
            color: 'var(--hof-text-sec)',
            marginTop: 4,
          }}
        >
          {subtitle}
        </div>
      </div>

      <GuestFilters
        events={events}
        tiers={tierOptions}
        filters={filters}
        onChange={setFilters}
        onExportCsv={filteredTickets.length > 0 ? exportCsv : undefined}
      />

      <GuestTierStatus
        events={tierStatus}
        loading={tierStatusLoading}
        scopeLabel={tierStatusScopeLabel}
      />

      <div style={{ padding: '0 28px 28px' }}>
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

        {loading && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              color: 'var(--hof-text-sec)',
            }}
          >
            Loading tickets…
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              color: 'var(--hof-text-sec)',
              background: 'var(--hof-surface)',
              border: '1px solid var(--hof-border)',
              borderRadius: 12,
            }}
          >
            No tickets match your filters.
          </div>
        )}

        {!loading &&
          groups.map(({ event, tickets: eventTickets }) => (
            <EventGuestSection
              key={event.id}
              event={event}
              tickets={eventTickets}
              defaultExpanded={event.id === defaultExpandedEventId}
              page={pagesByEvent[event.id] ?? 1}
              onPageChange={(p) =>
                setPagesByEvent((prev) => ({
                  ...prev,
                  [event.id]: p,
                }))
              }
              onViewTicket={setSelectedTicket}
            />
          ))}
      </div>

      <TicketDetailPanel
        ticket={selectedTicket}
        allTickets={filteredTickets}
        onClose={() => setSelectedTicket(null)}
      />
    </>
  );
}
