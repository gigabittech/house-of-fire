'use client';

import { useSupabaseRealtime, useRealtimeStatus } from '@hof/realtime';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Pill } from '@/components/Pill';
import { TablePagination } from '@/components/TablePagination';
import { TicketDetailPanel } from '@/components/TicketDetailPanel';
import {
  guestDisplayName,
  guestEmail,
  guestTierLabel,
  type AdminGuestTicket,
} from '@/lib/guestTicket';

const PAGE_SIZE = 10;

function formatCheckedIn(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

interface DoorLiveGuestsProps {
  eventId: string | null;
  refreshKey?: number;
}

export function DoorLiveGuests({ eventId, refreshKey = 0 }: DoorLiveGuestsProps) {
  const [guests, setGuests] = useState<AdminGuestTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detailTicket, setDetailTicket] = useState<AdminGuestTicket | null>(null);

  const loadGuests = useCallback(async () => {
    if (!eventId) {
      setGuests([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/door/guests?eventId=${eventId}&page=${page}&pageSize=${PAGE_SIZE}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        guests: AdminGuestTicket[];
        total: number;
      };
      setGuests(data.guests ?? []);
      setTotal(data.total ?? 0);
    } catch {
      /* keep prior */
    } finally {
      setLoading(false);
    }
  }, [eventId, page]);

  const loadGuestsRef = useRef(loadGuests);
  useEffect(() => {
    loadGuestsRef.current = loadGuests;
  }, [loadGuests]);

  useEffect(() => {
    void loadGuests();
  }, [loadGuests, refreshKey]);

  const { status: globalStatus } = useRealtimeStatus();

  useSupabaseRealtime({
    supabase: createClient(),
    table: 'tickets',
    filter: eventId ? `event_id=eq.${eventId}` : undefined,
    eventTypes: ['INSERT', 'UPDATE'],
    enabled: !!eventId,
    debounceMs: 300,
    onInsert: (row) => {
      if (row.status === 'used' && page === 1) void loadGuestsRef.current();
    },
    onUpdate: (row, oldRow) => {
      if (oldRow.status !== 'used' && row.status === 'used' && page === 1) {
        void loadGuestsRef.current();
      }
    },
    onResync: () => void loadGuestsRef.current(),
  });

  useEffect(() => {
    if (!eventId) return;
    if (globalStatus !== 'disconnected' && globalStatus !== 'error') return;
    const id = setInterval(() => void loadGuests(), 60_000);
    return () => clearInterval(id);
  }, [eventId, loadGuests, globalStatus]);

  useEffect(() => {
    setPage(1);
  }, [eventId]);

  const thStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui',
    fontSize: 10,
    color: 'var(--hof-text-sec)',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    textAlign: 'left',
    padding: '10px 12px',
    fontWeight: 500,
    borderBottom: '1px solid var(--hof-border)',
  };

  const tdStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui',
    fontSize: 13,
    color: 'var(--hof-text)',
    padding: '12px',
    borderBottom: '1px solid var(--hof-border)',
    verticalAlign: 'middle',
  };

  return (
    <>
      <div
        style={{
          background: 'var(--hof-surface)',
          border: '1px solid var(--hof-border)',
          borderRadius: 12,
          overflow: 'hidden',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 320,
        }}
      >
        <div
          style={{
            padding: '16px 18px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--hof-border)',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'Inter, system-ui',
                fontSize: 10,
                color: 'var(--hof-amber)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              Live activity
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
              On-site guests
            </div>
          </div>
          <Pill tone="success">{`${total} in`}</Pill>
        </div>

        <div style={{ flex: 1, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead>
              <tr>
                <th style={thStyle}>Guest</th>
                <th style={thStyle}>Tier</th>
                <th style={thStyle}>Code</th>
                <th style={thStyle}>Checked in</th>
                <th style={{ ...thStyle, textAlign: 'right' }} />
              </tr>
            </thead>
            <tbody>
              {loading && guests.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, color: 'var(--hof-text-sec)' }}>
                    Loading…
                  </td>
                </tr>
              ) : guests.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, color: 'var(--hof-text-sec)' }}>
                    No guests checked in yet.
                  </td>
                </tr>
              ) : (
                guests.map((g) => (
                  <tr key={g.id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{guestDisplayName(g)}</div>
                      <div style={{ fontSize: 11, color: 'var(--hof-text-sec)' }}>
                        {guestEmail(g)}
                      </div>
                    </td>
                    <td style={tdStyle}>{guestTierLabel(g)}</td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                      }}
                    >
                      {g.code}
                    </td>
                    <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>
                      {formatCheckedIn(g.checked_in_at ?? g.used_at)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setDetailTicket(g)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          background: 'transparent',
                          border: '1px solid var(--hof-border)',
                          color: 'var(--hof-amber)',
                          fontFamily: 'Inter, system-ui',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {detailTicket && (
        <TicketDetailPanel
          ticket={detailTicket}
          allTickets={guests}
          onClose={() => setDetailTicket(null)}
        />
      )}
    </>
  );
}
