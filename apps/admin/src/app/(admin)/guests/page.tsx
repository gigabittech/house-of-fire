'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGuestsRealtime } from '@/hooks/useGuestsRealtime';
import { EventGuestSection } from '@/components/EventGuestSection';
import {
  GuestFilters,
  type EventOption,
  type GuestFilterState,
} from '@/components/GuestFilters';
import {
  GuestTierStatus,
  type EventTierStatusGroup,
} from '@/components/GuestTierStatus';
import { TicketDetailPanel } from '@/components/TicketDetailPanel';
import {
  buildGuestExportCsv,
  groupTicketsByEvent,
  guestDisplayName,
  guestEmail,
  normalizeGuestTicket,
  tierOptionsFromEventTiers,
  tierOptionsFromTickets,
  ticketMatchesTierFilter,
  type AdminGuestTicket,
  type GuestTierOption,
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
  const [tierOptions, setTierOptions] = useState<GuestTierOption[]>([]);
  const [tickets, setTickets] = useState<AdminGuestTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<AdminGuestTicket | null>(null);
  const [tierStatus, setTierStatus] = useState<EventTierStatusGroup[]>([]);
  const [tierStatusLoading, setTierStatusLoading] = useState(true);
  const [pagesByEvent, setPagesByEvent] = useState<Record<string, number>>({});
  const [realtimeRefreshKey, setRealtimeRefreshKey] = useState(0);

  const debouncedEmail = useDebouncedValue(filters.email, 400);
  const debouncedCode = useDebouncedValue(filters.code, 400);
  const [eventsReady, setEventsReady] = useState(false);

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

          const live = mapped.find((e) => e.status === 'live');
          if (live) {
            setFilters((prev) => ({ ...prev, eventId: live.id }));
          }
        }
      } catch {
        /* keep empty */
      } finally {
        setEventsReady(true);
      }
    }
    void loadEvents();
  }, []);

  useEffect(() => {
    if (!eventsReady) return;

    let cancelled = false;
    async function loadTiers() {
      if (filters.eventId) {
        try {
          const res = await fetch(`/api/admin/events/${filters.eventId}/tiers`);
          const data = (await res.json()) as {
            tiers?: Array<{ id: string; display_name: string; name: string }>;
          };
          if (cancelled) return;
          setTierOptions(tierOptionsFromEventTiers(data.tiers ?? []));
        } catch {
          if (!cancelled) setTierOptions([]);
        }
        return;
      }
      if (!cancelled) setTierOptions(tierOptionsFromTickets(tickets));
    }
    void loadTiers();
    return () => {
      cancelled = true;
    };
  }, [eventsReady, filters.eventId, tickets]);

  useEffect(() => {
    if (!eventsReady) return;

    let cancelled = false;
    async function fetchGuests() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.eventId) params.set('eventId', filters.eventId);
        if (filters.tierId && filters.eventId && !filters.tierId.startsWith('group:')) {
          params.set('tierId', filters.tierId);
        }
        if (debouncedEmail) params.set('email', debouncedEmail);
        if (debouncedCode) params.set('code', debouncedCode);
        const qs = params.toString();
        const res = await fetch(`/api/admin/guests${qs ? `?${qs}` : ''}`);
        const data = (await res.json()) as { guests?: unknown[]; error?: string };
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setTickets([]);
        } else {
          setTickets((data.guests ?? []).map((row) => normalizeGuestTicket(row as Record<string, unknown>)));
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load guests');
        setTickets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchGuests();
    return () => {
      cancelled = true;
    };
  }, [eventsReady, filters.eventId, filters.tierId, debouncedEmail, debouncedCode, realtimeRefreshKey]);

  useEffect(() => {
    setPagesByEvent({});
  }, [filters.eventId, filters.tierId, debouncedEmail, debouncedCode, filters.nameSearch]);

  useEffect(() => {
    if (!eventsReady) return;

    let cancelled = false;
    async function loadTierStatus() {
      setTierStatusLoading(true);
      try {
        const params = filters.eventId ? `?eventId=${filters.eventId}` : '';
        const res = await fetch(`/api/admin/guests/status${params}`);
        const data = (await res.json()) as {
          events?: EventTierStatusGroup[];
          error?: string;
        };
        if (cancelled) return;
        if (!data.error && data.events) {
          setTierStatus(data.events);
        } else {
          setTierStatus([]);
        }
      } catch {
        if (!cancelled) setTierStatus([]);
      } finally {
        if (!cancelled) setTierStatusLoading(false);
      }
    }
    void loadTierStatus();
    return () => {
      cancelled = true;
    };
  }, [eventsReady, filters.eventId, realtimeRefreshKey]);

  const bumpRealtime = useCallback(() => {
    setRealtimeRefreshKey((k) => k + 1);
  }, []);

  useGuestsRealtime({
    eventId: filters.eventId,
    onResync: bumpRealtime,
    onTierStatusResync: bumpRealtime,
    enabled: eventsReady && !!filters.eventId,
  });

  const tierStatusScopeLabel = useMemo(() => {
    if (filters.eventId) {
      const ev = events.find((e) => e.id === filters.eventId);
      if (ev) return `${ev.name} · Edition ${ev.edition_number}`;
    }
    return 'All editions';
  }, [filters.eventId, events]);

  const nameQuery = filters.nameSearch.trim().toLowerCase();
  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (filters.tierId) {
      result = result.filter((t) => ticketMatchesTierFilter(t, filters.tierId, tierOptions));
    }
    if (!nameQuery) return result;
    return result.filter((t) => {
      const name = guestDisplayName(t).toLowerCase();
      const email = guestEmail(t).toLowerCase();
      return name.includes(nameQuery) || email.includes(nameQuery);
    });
  }, [tickets, filters.tierId, tierOptions, nameQuery]);

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
    const csv = buildGuestExportCsv(filteredTickets);
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
