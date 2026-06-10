'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import { Avatar } from '@/components/Avatar';
import { Kpi } from '@/components/Kpi';
import { Pill } from '@/components/Pill';
import { TierBar } from '@/components/TierBar';

interface EventRow {
  id: string;
  edition_number: number;
  name: string;
  date: string;
  status: 'upcoming' | 'live' | 'past' | 'cancelled';
  venue_name: string;
}

interface GuestRow {
  id: string;
  code: string;
  amount_cents: number;
  status: 'valid' | 'used' | 'transferred' | 'refunded' | 'cancelled';
  purchased_at: string;
  profiles: { display_name: string; handle: string; avatar_url: string | null } | null;
  ticket_tiers: { display_name: string; name: string } | null;
}

interface FinancialRow {
  event_id: string;
  edition_number: number;
  name: string;
  date: string;
  status: string;
  gross_cents: number;
  ticket_count: number;
}

interface PhotoRow {
  id: string;
  event_id: string;
  public_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: { handle: string; display_name: string; avatar_url: string | null } | null;
}

function SalesChart({ data }: { data: number[] }) {
  const chartData = (data.length > 0 ? data : [0]).map((v) =>
    Number.isFinite(v) ? Math.max(0, v) : 0,
  );
  const max = Math.max(...chartData, 1);
  const cumulative = chartData.reduce<number[]>((acc, v) => {
    const last = acc[acc.length - 1] ?? 0;
    acc.push(last + v);
    return acc;
  }, []);
  const cumMax = Math.max(cumulative[cumulative.length - 1] ?? 0, 1);
  const barWidth = 400 / Math.max(chartData.length, 1);

  return (
    <svg width="100%" height="180" viewBox="0 0 400 180" preserveAspectRatio="none">
      <defs>
        <linearGradient id="adm-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--hof-amber)" />
          <stop offset="100%" stopColor="var(--hof-ember)" />
        </linearGradient>
        <linearGradient id="adm-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--hof-amber)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--hof-amber)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1="0"
          y1={180 * g}
          x2="400"
          y2={180 * g}
          stroke="var(--hof-border)"
          strokeWidth="1"
        />
      ))}
      {chartData.map((v, i) => {
        const w = barWidth;
        const h = (v / max) * 130;
        return (
          <rect
            key={i}
            x={i * w + 4}
            y={170 - h}
            width={w - 8}
            height={h}
            fill="url(#adm-bar)"
            rx="2"
          />
        );
      })}
      {(() => {
        const pts = cumulative
          .map((v, i) => `${(i + 0.5) * barWidth},${170 - (v / cumMax) * 150}`)
          .join(' ');
        const fillPath = `M 0,170 L ${pts} L 400,170 Z`;
        const linePath = `M ${pts.replace(/ /g, ' L ')}`;
        return (
          <>
            <path d={fillPath} fill="url(#adm-fill)" />
            <path d={linePath} stroke="var(--hof-text)" strokeWidth="1.5" fill="none" />
            {cumulative.map((v, i) => (
              <circle
                key={i}
                cx={(i + 0.5) * barWidth}
                cy={170 - (v / cumMax) * 150}
                r="2.5"
                fill="var(--hof-text)"
              />
            ))}
          </>
        );
      })()}
    </svg>
  );
}

function GuestListWidget({
  guests,
  loading,
  searchQuery,
  onSearchChange,
}: {
  guests: GuestRow[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? guests.filter((g) => {
        const name = (g.profiles?.display_name ?? g.profiles?.handle ?? '').toLowerCase();
        const handle = (g.profiles?.handle ?? '').toLowerCase();
        return name.includes(q) || handle.includes(q) || g.code.toLowerCase().includes(q);
      })
    : guests;
  const displayGuests = filtered.slice(0, 6);

  return (
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
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--hof-border)',
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
            Guest list
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
            {loading
              ? '…'
              : `${filtered.length} confirmed · ${displayGuests.length} of ${filtered.length}`}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            background: 'var(--hof-elevated)',
            border: '1px solid var(--hof-border)',
            borderRadius: 8,
            width: 200,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle stroke="var(--hof-text-sec)" strokeWidth="1.5" cx="11" cy="11" r="7" />
            <path
              stroke="var(--hof-text-sec)"
              strokeWidth="1.5"
              strokeLinecap="round"
              d="M20 20 L16 16"
            />
          </svg>
          <input
            placeholder="Search name or email…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              border: 0,
              background: 'transparent',
              outline: 'none',
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text)',
              width: '100%',
            }}
          />
        </div>
      </div>
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 0.7fr',
            padding: '10px 16px',
            borderBottom: '1px solid var(--hof-border)',
            fontFamily: 'Inter, system-ui',
            fontSize: 10,
            color: 'var(--hof-text-sec)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          <div>Name</div>
          <div>Email</div>
          <div>Tier</div>
          <div>Status</div>
          <div>Purchased</div>
        </div>
        {loading && (
          <div
            style={{
              padding: '24px 16px',
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              color: 'var(--hof-text-sec)',
              textAlign: 'center',
            }}
          >
            Loading…
          </div>
        )}
        {!loading &&
          displayGuests.map((g, i) => {
            const name = g.profiles?.display_name ?? g.profiles?.handle ?? 'Unknown';
            const email = g.profiles?.handle ?? '—';
            const tier = g.ticket_tiers?.display_name ?? g.ticket_tiers?.name ?? 'General';
            const initials = name
              .split(' ')
              .map((p: string) => p[0] ?? '')
              .join('');
            const purchased = new Date(g.purchased_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            const isVip = tier.toLowerCase().includes('vip');
            const statusTone =
              g.status === 'used'
                ? 'success'
                : g.status === 'refunded'
                  ? 'danger'
                  : g.status === 'valid'
                    ? 'success'
                    : 'neutral';

            return (
              <div
                key={g.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 0.7fr',
                  padding: '12px 16px',
                  borderBottom:
                    i < displayGuests.length - 1 ? '1px solid var(--hof-border)' : 'none',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  color: 'var(--hof-text)',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={initials} src={g.profiles?.avatar_url} alt={name} size={28} />
                  {name}
                </div>
                <div style={{ color: 'var(--hof-text-sec)', fontSize: 12 }}>{email}</div>
                <div>
                  <Pill tone={isVip ? 'gold' : 'neutral'} size="sm">
                    {tier}
                  </Pill>
                </div>
                <div>
                  <Pill tone={statusTone} size="sm">
                    {g.status}
                  </Pill>
                </div>
                <div
                  style={{
                    color: 'var(--hof-text-sec)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                  }}
                >
                  {purchased}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function PhotoReviewWidget({
  photos,
  loading,
  onApprove,
  onReject,
}: {
  photos: PhotoRow[];
  loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const pending = photos.filter((p) => p.status === 'pending');

  return (
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
          alignItems: 'baseline',
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
            Photo review
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
            {loading ? '…' : `${pending.length} pending`}
          </div>
        </div>
        <Pill tone="warning" size="sm">
          Pending review
        </Pill>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {loading &&
          [0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: '100%',
                aspectRatio: '1/1',
                borderRadius: 8,
                background: 'var(--hof-elevated)',
                border: '1px solid var(--hof-border)',
              }}
            />
          ))}
        {!loading &&
          pending.slice(0, 4).map((photo) => (
            <div key={photo.id} style={{ position: 'relative' }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: 8,
                  background: 'var(--hof-elevated)',
                  border: '1px solid var(--hof-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {photo.public_url ? (
                  <img
                    src={photo.public_url}
                    alt={`Photo by ${photo.profiles?.handle ?? 'unknown'}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect
                      stroke="var(--hof-border-hi)"
                      strokeWidth="1.5"
                      x="3"
                      y="4"
                      width="18"
                      height="16"
                      rx="2"
                    />
                    <circle
                      stroke="var(--hof-border-hi)"
                      strokeWidth="1.5"
                      cx="9"
                      cy="10"
                      r="1.5"
                    />
                    <path
                      stroke="var(--hof-border-hi)"
                      strokeWidth="1.5"
                      d="M3 17 L9 12 L15 17 L21 13"
                    />
                  </svg>
                )}
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: 6,
                  bottom: 6,
                  right: 6,
                  display: 'flex',
                  gap: 4,
                }}
              >
                <button
                  onClick={() => onApprove(photo.id)}
                  style={{
                    flex: 1,
                    height: 26,
                    background: 'var(--hof-success)',
                    color: 'var(--hof-bg)',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 11,
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ✓
                </button>
                <button
                  onClick={() => onReject(photo.id)}
                  style={{
                    flex: 1,
                    height: 26,
                    background: 'rgba(20,20,18,0.85)',
                    color: 'var(--hof-text)',
                    borderRadius: 4,
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

const TIER_COLORS = ['var(--hof-amber)', 'var(--hof-glow)', 'var(--hof-gold)'];

export default function DashboardPage() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [financials, setFinancials] = useState<FinancialRow[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestSearch, setGuestSearch] = useState('');
  const [period, setPeriod] = useState<'1D' | '7D' | '14D' | 'All'>('14D');
  const [salesData, setSalesData] = useState<number[]>([]);
  const [tierBars, setTierBars] = useState<Array<{ label: string; sold: number; cap: number }>>([]);
  const [openRequests, setOpenRequests] = useState(0);
  const [doorSalesCount, setDoorSalesCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        // Fetch active event (live, else upcoming) for dashboard metrics
        const evRes = await fetch('/api/admin/events');
        const evData = (await evRes.json()) as { events: EventRow[] };
        const activeEvent =
          (evData.events ?? []).find((e) => e.status === 'live') ??
          (evData.events ?? []).find((e) => e.status === 'upcoming') ??
          null;
        setEvent(activeEvent);

        // Fetch guests for that event (if found)
        const guestUrl = activeEvent
          ? `/api/admin/guests?eventId=${activeEvent.id}`
          : '/api/admin/guests';
        const gRes = await fetch(guestUrl);
        const gData = (await gRes.json()) as { guests: GuestRow[] };
        setGuests(gData.guests ?? []);

        // Fetch financials
        const fRes = await fetch('/api/admin/financials');
        const fData = (await fRes.json()) as { financials: FinancialRow[] };
        setFinancials(fData.financials ?? []);

        // Fetch pending photos
        const pRes = await fetch('/api/admin/media?status=pending');
        const pData = (await pRes.json()) as { photos: PhotoRow[] };
        setPhotos(pData.photos ?? []);
      } catch {
        // silent — widgets show empty state
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const loadMetrics = useCallback(async () => {
    const eventId = event?.id;
    if (!eventId) return;
    try {
      const res = await fetch(`/api/admin/dashboard/metrics?eventId=${eventId}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        salesData: number[];
        tierBars: Array<{ label: string; sold: number; cap: number }>;
        openRequests?: number;
        salesByChannel?: { online: number; door: number };
      };
      setSalesData(data.salesData ?? []);
      setTierBars(data.tierBars ?? []);
      setOpenRequests(data.openRequests ?? 0);
      setDoorSalesCount(data.salesByChannel?.door ?? 0);
    } catch {
      /* keep prior */
    }
  }, [event?.id]);

  const loadGuests = useCallback(async () => {
    const guestUrl = event?.id
      ? `/api/admin/guests?eventId=${event.id}`
      : '/api/admin/guests';
    try {
      const gRes = await fetch(guestUrl);
      const gData = (await gRes.json()) as { guests: GuestRow[] };
      setGuests(gData.guests ?? []);
    } catch {
      /* keep prior */
    }
  }, [event?.id]);

  const loadPendingPhotos = useCallback(async () => {
    try {
      const pRes = await fetch('/api/admin/media?status=pending');
      const pData = (await pRes.json()) as { photos: PhotoRow[] };
      setPhotos(pData.photos ?? []);
    } catch {
      /* keep prior */
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  useDashboardRealtime({
    eventId: event?.id,
    onMetricsResync: loadMetrics,
    onGuestsResync: loadGuests,
    onPhotosResync: loadPendingPhotos,
    enabled: !loading,
  });

  function exportGuestsCsv() {
    const header = ['code', 'name', 'handle', 'tier', 'status', 'purchased_at', 'amount_cents'];
    const rows = guests.map((g) => [
      g.code,
      g.profiles?.display_name ?? '',
      g.profiles?.handle ?? '',
      g.ticket_tiers?.display_name ?? g.ticket_tiers?.name ?? '',
      g.status,
      g.purchased_at,
      String(g.amount_cents),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests-${event?.edition_number ?? 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const periodSlice =
    period === '1D' ? 1 : period === '7D' ? 7 : period === '14D' ? 14 : salesData.length;
  const chartData = salesData.length > 0 ? salesData.slice(-periodSlice) : salesData;

  async function handlePhotoAction(id: string, status: 'approved' | 'rejected') {
    try {
      await fetch('/api/admin/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    } catch {
      // silent
    }
  }

  // Compute KPI values
  const currentFinancial = financials.find((f) => f.event_id === event?.id);
  const grossCents = currentFinancial?.gross_cents ?? 0;
  const grossFormatted = `$${(grossCents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const ticketCount = guests.length;
  const checkedIn = guests.filter((g) => g.status === 'used').length;

  const eventTitle = event
    ? `${event.name} · Theme ${event.edition_number}`
    : 'There are currently no events available.';
  const eventSub = event
    ? `${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${event.venue_name}`
    : 'Mark a theme as Upcoming or Live in Events to see dashboard metrics';

  return (
    <>
      {/* Header */}
      <div
        style={{
          padding: '22px 28px 18px',
          borderBottom: '1px solid var(--hof-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
            Dashboard
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
            {eventTitle}
          </div>
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text-sec)',
              marginTop: 4,
            }}
          >
            {eventSub}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => exportGuestsCsv()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--hof-border)',
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--hof-text)',
              cursor: 'pointer',
            }}
          >
            Export CSV
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 8,
              background: 'var(--hof-amber)',
              border: 'none',
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--hof-bg)',
              cursor: 'pointer',
            }}
          >
            + New event
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div
        style={{
          padding: '20px 28px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
        }}
      >
        <Kpi
          label="Revenue · gross"
          value={loading ? '…' : grossFormatted}
          delta="Current event"
          tone="amber"
        />
        <Kpi
          label="Tickets sold"
          value={loading ? '…' : `${ticketCount}`}
          delta="Confirmed guests"
          tone="neutral"
        />
        <Kpi
          label="Door sales"
          value={loading ? '…' : String(doorSalesCount)}
          delta="Walk-up at the door"
          tone="amber"
        />
        <Kpi
          label="Checked in"
          value={loading ? '…' : String(checkedIn)}
          delta="Doors open event night"
          tone="muted"
        />
        <Kpi
          label="Open requests"
          value={loading ? '…' : String(openRequests)}
          delta={openRequests === 0 ? 'Nothing pending' : 'Refund requests awaiting review'}
          tone="warning"
        />
      </div>

      {/* Two-col charts */}
      <div
        style={{
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 16,
        }}
      >
        {/* Sales trend */}
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
              alignItems: 'baseline',
              justifyContent: 'space-between',
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
                Sales · 14 days
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
                Steady momentum
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['1D', '7D', '14D', 'All'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontSize: 11,
                    fontWeight: 500,
                    padding: '5px 10px',
                    borderRadius: 6,
                    background: p === period ? 'var(--hof-elevated)' : 'transparent',
                    color: p === period ? 'var(--hof-text)' : 'var(--hof-text-sec)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <SalesChart data={chartData} />
        </div>

        {/* Tier breakdown */}
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
            By tier
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(tierBars.length > 0 ? tierBars : [{ label: '—', sold: 0, cap: 1 }]).map((tier, i) => {
              const left = Math.max(0, tier.cap - tier.sold);
              const sub = left === 0 && tier.cap > 0 ? 'sold out' : `${left} left`;
              return (
                <TierBar
                  key={tier.label}
                  name={tier.label}
                  sold={tier.sold}
                  total={tier.cap}
                  color={TIER_COLORS[i % TIER_COLORS.length] ?? 'var(--hof-amber)'}
                  sub={sub}
                />
              );
            })}
          </div>
          <div
            style={{
              marginTop: 18,
              padding: '12px 0 0',
              borderTop: '1px solid var(--hof-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <span
              style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text-sec)' }}
            >
              Projected at sellout
            </span>
            <span
              style={{
                fontFamily: 'Clash Display, system-ui',
                fontWeight: 600,
                fontSize: 18,
                color: 'var(--hof-text)',
              }}
            >
              $9,260
            </span>
          </div>
        </div>
      </div>

      {/* Guest list + Photo review */}
      <div
        style={{
          padding: '0 28px 28px',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 16,
        }}
      >
        <GuestListWidget
          guests={guests}
          loading={loading}
          searchQuery={guestSearch}
          onSearchChange={setGuestSearch}
        />
        <PhotoReviewWidget
          photos={photos}
          loading={loading}
          onApprove={(id) => void handlePhotoAction(id, 'approved')}
          onReject={(id) => void handlePhotoAction(id, 'rejected')}
        />
      </div>
    </>
  );
}
