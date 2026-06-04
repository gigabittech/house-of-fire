'use client';

import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Pill } from '@/components/Pill';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@/components/TablePagination';
import {
  formatPurchasedAt,
  guestDisplayName,
  guestEmail,
  guestTierLabel,
  type AdminGuestEvent,
  type AdminGuestTicket,
} from '@/lib/guestTicket';

function statusTone(status: AdminGuestTicket['status']): 'success' | 'danger' | 'neutral' | 'warning' {
  if (status === 'used' || status === 'valid') return 'success';
  if (status === 'refunded' || status === 'cancelled') return 'danger';
  if (status === 'transferred') return 'warning';
  return 'neutral';
}

function eventStatusTone(status: string): 'success' | 'amber' | 'neutral' | 'danger' {
  if (status === 'live') return 'success';
  if (status === 'upcoming') return 'amber';
  if (status === 'cancelled') return 'danger';
  return 'neutral';
}

interface EventGuestSectionProps {
  event: NonNullable<AdminGuestEvent>;
  tickets: AdminGuestTicket[];
  defaultExpanded?: boolean;
  page?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onViewTicket: (ticket: AdminGuestTicket) => void;
}

export function EventGuestSection({
  event,
  tickets,
  defaultExpanded = false,
  page = 1,
  onPageChange,
  pageSize = DEFAULT_PAGE_SIZE,
  onViewTicket,
}: EventGuestSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tickets.slice(start, start + pageSize);
  }, [tickets, page, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));
    if (page > totalPages && onPageChange) {
      onPageChange(totalPages);
    }
  }, [tickets.length, page, pageSize, onPageChange]);

  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      style={{
        background: 'var(--hof-surface)',
        border: '1px solid var(--hof-border)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          border: 0,
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Clash Display, system-ui',
              fontWeight: 600,
              fontSize: 16,
              color: 'var(--hof-text)',
            }}
          >
            Edition {event.edition_number} · {event.name}
          </div>
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text-sec)',
              marginTop: 4,
            }}
          >
            {eventDate} · {event.venue_name} · {tickets.length} ticket
            {tickets.length === 1 ? '' : 's'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Pill tone={eventStatusTone(event.status)} size="sm">
            {event.status}
          </Pill>
          <span
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 18,
              color: 'var(--hof-text-sec)',
              lineHeight: 1,
            }}
            aria-hidden
          >
            {expanded ? '−' : '+'}
          </span>
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--hof-border)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.4fr 1.2fr 0.8fr 0.7fr 1fr 0.6fr',
              padding: '10px 18px',
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              color: 'var(--hof-text-sec)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              borderBottom: '1px solid var(--hof-border)',
            }}
          >
            <div>Code</div>
            <div>Guest</div>
            <div>Email</div>
            <div>Tier</div>
            <div>Status</div>
            <div>Purchased</div>
            <div />
          </div>
          {paginatedTickets.map((t, i) => {
            const name = guestDisplayName(t);
            const initials = name
              .split(' ')
              .map((p) => p[0] ?? '')
              .join('');
            const isVip = guestTierLabel(t).toLowerCase().includes('vip');
            return (
              <div
                key={t.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.4fr 1.2fr 0.8fr 0.7fr 1fr 0.6fr',
                  padding: '12px 18px',
                  alignItems: 'center',
                  borderBottom:
                    i < paginatedTickets.length - 1 ? '1px solid var(--hof-border)' : 'none',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  color: 'var(--hof-text)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    color: 'var(--hof-text-sec)',
                  }}
                >
                  {t.code}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={initials} size={28} />
                  <span style={{ fontWeight: 500 }}>{name}</span>
                </div>
                <div style={{ color: 'var(--hof-text-sec)', fontSize: 12 }}>{guestEmail(t)}</div>
                <div>
                  <Pill tone={isVip ? 'gold' : 'neutral'} size="sm">
                    {guestTierLabel(t)}
                  </Pill>
                </div>
                <div>
                  <Pill tone={statusTone(t.status)} size="sm">
                    {t.status}
                  </Pill>
                </div>
                <div
                  style={{
                    color: 'var(--hof-text-sec)',
                    fontSize: 11,
                  }}
                >
                  {formatPurchasedAt(t.purchased_at)}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => onViewTicket(t)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--hof-border)',
                      background: 'var(--hof-elevated)',
                      fontFamily: 'Inter, system-ui',
                      fontSize: 11,
                      color: 'var(--hof-text)',
                      cursor: 'pointer',
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
          {onPageChange && (
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={tickets.length}
              onPageChange={onPageChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
