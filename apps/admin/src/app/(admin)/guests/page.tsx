'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchAdminGuestByTicketId } from '@/lib/fetchGuestTicket';
import {
  isSoldTicketStatus,
  patchGuestTicketRow,
  patchTierStatusOnTicketDelta,
} from '@/lib/realtimePatch';
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
import { DEFAULT_PAGE_SIZE, TablePagination } from '@/components/TablePagination';
import type { ApiPagination } from '@/lib/pagination';
import {
  buildGuestExportCsv,
  groupTicketsByEvent,
  normalizeGuestTicket,
  tierOptionsFromEventTiers,
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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ApiPagination>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  });

  const debouncedEmail = useDebouncedValue(filters.email, 400);
  const debouncedCode = useDebouncedValue(filters.code, 400);
  const debouncedNameSearch = useDebouncedValue(filters.nameSearch, 400);
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
      if (!cancelled) setTierOptions([]);
    }
    void loadTiers();
    return () => {
      cancelled = true;
    };
  }, [eventsReady, filters.eventId]);

  const fetchGuests = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!eventsReady) return;
      if (!options?.silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(DEFAULT_PAGE_SIZE));
        if (filters.eventId) params.set('eventId', filters.eventId);
        if (filters.tierId && filters.eventId && !filters.tierId.startsWith('group:')) {
          params.set('tierId', filters.tierId);
        }
        if (debouncedEmail) params.set('email', debouncedEmail);
        if (debouncedCode) params.set('code', debouncedCode);
        if (debouncedNameSearch.trim()) params.set('nameSearch', debouncedNameSearch.trim());
        const res = await fetch(`/api/admin/guests?${params}`);
        const data = (await res.json()) as {
          guests?: unknown[];
          pagination?: ApiPagination;
          error?: string;
        };
        if (data.error) {
          setError(data.error);
          setTickets([]);
        } else {
          setTickets((data.guests ?? []).map((row) => normalizeGuestTicket(row as Record<string, unknown>)));
          if (data.pagination) setPagination(data.pagination);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load guests');
        setTickets([]);
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [
      eventsReady,
      page,
      filters.eventId,
      filters.tierId,
      debouncedEmail,
      debouncedCode,
      debouncedNameSearch,
    ],
  );

  const fetchGuestsRef = useRef(fetchGuests);
  useEffect(() => {
    fetchGuestsRef.current = fetchGuests;
  }, [fetchGuests]);

  useEffect(() => {
    void fetchGuests();
  }, [fetchGuests]);

  useEffect(() => {
    setPage(1);
  }, [filters.eventId, filters.tierId, debouncedEmail, debouncedCode, debouncedNameSearch]);

  const loadTierStatus = useCallback(async () => {
    if (!eventsReady) return;
    setTierStatusLoading(true);
    try {
      const params = filters.eventId ? `?eventId=${filters.eventId}` : '';
      const res = await fetch(`/api/admin/guests/status${params}`);
      const data = (await res.json()) as { events?: EventTierStatusGroup[]; error?: string };
      if (!data.error && data.events) setTierStatus(data.events);
      else setTierStatus([]);
    } catch {
      setTierStatus([]);
    } finally {
      setTierStatusLoading(false);
    }
  }, [eventsReady, filters.eventId]);

  useEffect(() => {
    void loadTierStatus();
  }, [loadTierStatus]);

  useEffect(() => {
    if (!eventsReady || !filters.eventId) return;
    const id = setInterval(() => void loadTierStatus(), 15_000);
    return () => clearInterval(id);
  }, [eventsReady, filters.eventId, loadTierStatus]);

  useGuestsRealtime({
    eventId: filters.eventId,
    enabled: eventsReady && !!filters.eventId,
    onTicketInsert: (row) => {
      if (row.tier_id && row.event_id && isSoldTicketStatus(row.status)) {
        setTierStatus((prev) => patchTierStatusOnTicketDelta(prev, row.tier_id!, row.event_id!, 1));
      }
      setPagination((p) => ({ ...p, totalCount: p.totalCount + 1 }));
      if (page !== 1) return;
      const hasTextFilters = !!(debouncedEmail || debouncedCode || debouncedNameSearch);
      if (hasTextFilters) {
        void fetchGuestsRef.current({ silent: true });
        return;
      }
      void fetchAdminGuestByTicketId(row.id).then((guest) => {
        if (!guest) return;
        if (filters.tierId && !ticketMatchesTierFilter(guest, filters.tierId, tierOptions)) return;
        setTickets((prev) => {
          if (prev.some((t) => t.id === guest.id)) return prev;
          return [guest, ...prev].slice(0, pagination.pageSize);
        });
      });
    },
    onTicketUpdate: (row, oldRow) => {
      setTickets((prev) => patchGuestTicketRow(prev, row));
      if (row.tier_id && row.event_id) {
        const wasSold = isSoldTicketStatus(oldRow.status);
        const isSold = isSoldTicketStatus(row.status);
        if (wasSold !== isSold) {
          setTierStatus((prev) =>
            patchTierStatusOnTicketDelta(prev, row.tier_id!, row.event_id!, isSold ? 1 : -1),
          );
        }
      }
    },
    onTicketDelete: (oldRow) => {
      if (oldRow.id) {
        setTickets((prev) => prev.filter((t) => t.id !== oldRow.id));
        setPagination((p) => ({ ...p, totalCount: Math.max(0, p.totalCount - 1) }));
      }
      if (oldRow.tier_id && oldRow.event_id && isSoldTicketStatus(oldRow.status)) {
        setTierStatus((prev) =>
          patchTierStatusOnTicketDelta(prev, oldRow.tier_id!, oldRow.event_id!, -1),
        );
      }
    },
    onResync: () => {
      void fetchGuestsRef.current({ silent: true });
      void loadTierStatus();
    },
  });

  const tierStatusScopeLabel = useMemo(() => {
    if (filters.eventId) {
      const ev = events.find((e) => e.id === filters.eventId);
      if (ev) return `${ev.name} · Edition ${ev.edition_number}`;
    }
    return 'All editions';
  }, [filters.eventId, events]);

  const filteredTickets = useMemo(() => {
    if (!filters.tierId || filters.tierId.startsWith('group:')) {
      return tickets;
    }
    return tickets.filter((t) => ticketMatchesTierFilter(t, filters.tierId, tierOptions));
  }, [tickets, filters.tierId, tierOptions]);

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
        return `${ev.name} · Edition ${ev.edition_number} · ${pagination.totalCount} ticket${pagination.totalCount === 1 ? '' : 's'}`;
      }
    }
    const eventCount = groups.length;
    return `All editions · ${pagination.totalCount} ticket${pagination.totalCount === 1 ? '' : 's'} across ${eventCount} event${eventCount === 1 ? '' : 's'} on this page`;
  }, [filters.eventId, events, pagination.totalCount, groups.length]);

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
          {loading ? 'Loading…' : `${pagination.totalCount.toLocaleString()} confirmed`}
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
              onViewTicket={setSelectedTicket}
            />
          ))}

        {!loading && groups.length > 0 && (
          <div
            style={{
              background: 'var(--hof-surface)',
              border: '1px solid var(--hof-border)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <TablePagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.totalCount}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <TicketDetailPanel
        ticket={selectedTicket}
        allTickets={filteredTickets}
        onClose={() => setSelectedTicket(null)}
      />
    </>
  );
}
