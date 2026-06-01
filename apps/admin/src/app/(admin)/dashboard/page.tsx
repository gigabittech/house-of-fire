'use client';

import { useState, useEffect } from 'react';
import { Kpi } from '@/components/Kpi.js';
import { TierBar } from '@/components/TierBar.js';
import { Pill } from '@/components/Pill.js';
import { Avatar } from '@/components/Avatar.js';

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

function SalesChart() {
  const data = [4, 6, 5, 9, 12, 18, 10, 14, 22, 31, 28, 20, 26, 18];
  const max = Math.max(...data);
  const cumulative = data.reduce<number[]>((acc, v) => {
    const last = acc[acc.length - 1] ?? 0;
    acc.push(last + v);
    return acc;
  }, []);
  const cumMax = cumulative[cumulative.length - 1] ?? 1;

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
        <line key={g} x1="0" y1={180 * g} x2="400" y2={180 * g} stroke="var(--hof-border)" strokeWidth="1" />
      ))}
      {data.map((v, i) => {
        const w = 400 / data.length;
        const h = (v / max) * 130;
        return <rect key={i} x={i * w + 4} y={170 - h} width={w - 8} height={h} fill="url(#adm-bar)" rx="2" />;
      })}
      {(() => {
        const pts = cumulative.map((v, i) =>
          `${(i + 0.5) * (400 / data.length)},${170 - (v / cumMax) * 150}`
        ).join(' ');
        const fillPath = `M 0,170 L ${pts} L 400,170 Z`;
        const linePath = `M ${pts.replace(/ /g, ' L ')}`;
        return (
          <>
            <path d={fillPath} fill="url(#adm-fill)" />
            <path d={linePath} stroke="var(--hof-text)" strokeWidth="1.5" fill="none" />
            {cumulative.map((v, i) => (
              <circle
                key={i}
                cx={(i + 0.5) * (400 / data.length)}
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

function GuestListWidget({ guests, loading }: { guests: GuestRow[]; loading: boolean }) {
  const displayGuests = guests.slice(0, 6);

  return (
    <div style={{
      background: 'var(--hof-surface)', border: '1px solid var(--hof-border)', borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--hof-border)',
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter, system-ui', fontSize: 10, color: 'var(--hof-text-sec)',
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Guest list</div>
          <div style={{
            fontFamily: 'Clash Display, system-ui', fontWeight: 600, fontSize: 18,
            color: 'var(--hof-text)', marginTop: 4,
          }}>
            {loading ? '…' : `${guests.length} confirmed · ${displayGuests.length} of ${guests.length}`}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', background: 'var(--hof-elevated)', border: '1px solid var(--hof-border)',
          borderRadius: 8, width: 200,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle stroke="var(--hof-text-sec)" strokeWidth="1.5" cx="11" cy="11" r="7"/>
            <path stroke="var(--hof-text-sec)" strokeWidth="1.5" strokeLinecap="round" d="M20 20 L16 16"/>
          </svg>
          <input placeholder="Search name or email…" style={{
            border: 0, background: 'transparent', outline: 'none',
            fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text)', width: '100%',
          }} />
        </div>
      </div>
      <div>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 0.7fr',
          padding: '10px 16px', borderBottom: '1px solid var(--hof-border)',
          fontFamily: 'Inter, system-ui', fontSize: 10, color: 'var(--hof-text-sec)',
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          <div>Name</div><div>Email</div><div>Tier</div><div>Status</div><div>Purchased</div>
        </div>
        {loading && (
          <div style={{
            padding: '24px 16px', fontFamily: 'Inter, system-ui', fontSize: 13,
            color: 'var(--hof-text-sec)', textAlign: 'center',
          }}>Loading…</div>
        )}
        {!loading && displayGuests.map((g, i) => {
          const name = g.profiles?.display_name ?? g.profiles?.handle ?? 'Unknown';
          const email = g.profiles?.handle ?? '—';
          const tier = g.ticket_tiers?.display_name ?? g.ticket_tiers?.name ?? 'General';
          const initials = name.split(' ').map((p: string) => p[0] ?? '').join('');
          const purchased = new Date(g.purchased_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const isVip = tier.toLowerCase().includes('vip');
          const statusTone = g.status === 'used' ? 'success' : g.status === 'refunded' ? 'danger' : g.status === 'valid' ? 'success' : 'neutral';

          return (
            <div key={g.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 0.7fr',
              padding: '12px 16px',
              borderBottom: i < displayGuests.length - 1 ? '1px solid var(--hof-border)' : 'none',
              fontFamily: 'Inter, system-ui', fontSize: 13, color: 'var(--hof-text)', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={initials} size={28} />
                {name}
              </div>
              <div style={{ color: 'var(--hof-text-sec)', fontSize: 12 }}>{email}</div>
              <div><Pill tone={isVip ? 'gold' : 'neutral'} size="sm">{tier}</Pill></div>
              <div><Pill tone={statusTone} size="sm">{g.status}</Pill></div>
              <div style={{ color: 'var(--hof-text-sec)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                {purchased}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhotoReviewWidget({ photos, loading, onApprove, onReject }: {
  photos: PhotoRow[];
  loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const pending = photos.filter((p) => p.status === 'pending');

  return (
    <div style={{
      background: 'var(--hof-surface)', border: '1px solid var(--hof-border)', borderRadius: 12,
      padding: 18,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14,
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter, system-ui', fontSize: 10, color: 'var(--hof-text-sec)',
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Photo review</div>
          <div style={{
            fontFamily: 'Clash Display, system-ui', fontWeight: 600, fontSize: 18,
            color: 'var(--hof-text)', marginTop: 4,
          }}>{loading ? '…' : `${pending.length} pending`}</div>
        </div>
        <Pill tone="warning" size="sm">Pending review</Pill>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {loading && [0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            width: '100%', aspectRatio: '1/1', borderRadius: 8,
            background: 'var(--hof-elevated)', border: '1px solid var(--hof-border)',
          }} />
        ))}
        {!loading && pending.slice(0, 4).map((photo) => (
          <div key={photo.id} style={{ position: 'relative' }}>
            <div style={{
              width: '100%', aspectRatio: '1/1', borderRadius: 8,
              background: 'var(--hof-elevated)', border: '1px solid var(--hof-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {photo.public_url ? (
                <img
                  src={photo.public_url}
                  alt={`Photo by ${photo.profiles?.handle ?? 'unknown'}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect stroke="var(--hof-border-hi)" strokeWidth="1.5" x="3" y="4" width="18" height="16" rx="2"/>
                  <circle stroke="var(--hof-border-hi)" strokeWidth="1.5" cx="9" cy="10" r="1.5"/>
                  <path stroke="var(--hof-border-hi)" strokeWidth="1.5" d="M3 17 L9 12 L15 17 L21 13"/>
                </svg>
              )}
            </div>
            <div style={{
              position: 'absolute', left: 6, bottom: 6, right: 6,
              display: 'flex', gap: 4,
            }}>
              <button onClick={() => onApprove(photo.id)} style={{
                flex: 1, height: 26, background: 'var(--hof-success)', color: 'var(--hof-bg)', borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Inter, system-ui', fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer',
              }}>✓</button>
              <button onClick={() => onReject(photo.id)} style={{
                flex: 1, height: 26, background: 'rgba(20,20,18,0.85)', color: 'var(--hof-text)',
                borderRadius: 4, backdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Inter, system-ui', fontSize: 11, fontWeight: 500,
              }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [financials, setFinancials] = useState<FinancialRow[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch most recent upcoming/live event
        const evRes = await fetch('/api/admin/events');
        const evData = await evRes.json() as { events: EventRow[] };
        const upcomingOrLive = (evData.events ?? []).find(
          (e) => e.status === 'upcoming' || e.status === 'live'
        ) ?? evData.events?.[0] ?? null;
        setEvent(upcomingOrLive);

        // Fetch guests for that event (if found)
        const guestUrl = upcomingOrLive
          ? `/api/admin/guests?eventId=${upcomingOrLive.id}`
          : '/api/admin/guests';
        const gRes = await fetch(guestUrl);
        const gData = await gRes.json() as { guests: GuestRow[] };
        setGuests(gData.guests ?? []);

        // Fetch financials
        const fRes = await fetch('/api/admin/financials');
        const fData = await fRes.json() as { financials: FinancialRow[] };
        setFinancials(fData.financials ?? []);

        // Fetch pending photos
        const pRes = await fetch('/api/admin/media?status=pending');
        const pData = await pRes.json() as { photos: PhotoRow[] };
        setPhotos(pData.photos ?? []);
      } catch {
        // silent — widgets show empty state
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handlePhotoAction(id: string, status: 'approved' | 'rejected') {
    try {
      await fetch('/api/admin/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
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

  const eventTitle = event ? `${event.name} · Edition ${event.edition_number}` : 'Dashboard';
  const eventSub = event
    ? `${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${event.venue_name}`
    : '—';

  return (
    <>
      {/* Header */}
      <div style={{
        padding: '22px 28px 18px', borderBottom: '1px solid var(--hof-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter, system-ui', fontSize: 10, color: 'var(--hof-text-sec)',
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Dashboard</div>
          <div style={{
            fontFamily: 'Clash Display, system-ui', fontWeight: 600, fontSize: 26,
            color: 'var(--hof-text)', letterSpacing: '-0.01em', marginTop: 4,
          }}>{eventTitle}</div>
          <div style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text-sec)', marginTop: 4 }}>
            {eventSub}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 14px', borderRadius: 8,
            background: 'transparent', border: '1px solid var(--hof-border)',
            fontFamily: 'Inter, system-ui', fontSize: 13, fontWeight: 500,
            color: 'var(--hof-text)', cursor: 'pointer',
          }}>Export CSV</button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 14px', borderRadius: 8,
            background: 'var(--hof-amber)', border: 'none',
            fontFamily: 'Inter, system-ui', fontSize: 13, fontWeight: 600,
            color: 'var(--hof-bg)', cursor: 'pointer',
          }}>+ New event</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{
        padding: '20px 28px 0',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
      }}>
        <Kpi label="Revenue · gross" value={loading ? '…' : grossFormatted} delta="Current event" tone="amber" />
        <Kpi label="Tickets sold" value={loading ? '…' : `${ticketCount}`} delta="Confirmed guests" tone="neutral" />
        <Kpi label="Checked in" value={loading ? '…' : String(checkedIn)} delta="Doors open event night" tone="muted" />
        <Kpi label="Open requests" value="0" delta="Nothing pending" tone="warning" />
      </div>

      {/* Two-col charts */}
      <div style={{
        padding: '20px 28px',
        display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16,
      }}>
        {/* Sales trend */}
        <div style={{
          background: 'var(--hof-surface)', border: '1px solid var(--hof-border)', borderRadius: 12,
          padding: 18,
        }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14,
          }}>
            <div>
              <div style={{
                fontFamily: 'Inter, system-ui', fontSize: 10, color: 'var(--hof-text-sec)',
                letterSpacing: '0.22em', textTransform: 'uppercase',
              }}>Sales · 14 days</div>
              <div style={{
                fontFamily: 'Clash Display, system-ui', fontWeight: 600, fontSize: 18,
                color: 'var(--hof-text)', marginTop: 4,
              }}>Steady momentum</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['1D', '7D', '14D', 'All'].map((p) => (
                <span key={p} style={{
                  fontFamily: 'Inter, system-ui', fontSize: 11, fontWeight: 500,
                  padding: '5px 10px', borderRadius: 6,
                  background: p === '14D' ? 'var(--hof-elevated)' : 'transparent',
                  color: p === '14D' ? 'var(--hof-text)' : 'var(--hof-text-sec)',
                }}>{p}</span>
              ))}
            </div>
          </div>
          <SalesChart />
        </div>

        {/* Tier breakdown */}
        <div style={{
          background: 'var(--hof-surface)', border: '1px solid var(--hof-border)', borderRadius: 12,
          padding: 18,
        }}>
          <div style={{
            fontFamily: 'Inter, system-ui', fontSize: 10, color: 'var(--hof-text-sec)',
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 14,
          }}>By tier</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TierBar name="Early Bird" sold={80}  total={80}  color="var(--hof-amber)" sub="$1,600 · sold out" />
            <TierBar name="General"    sold={143} total={180} color="var(--hof-glow)"  sub="$4,004 · 37 left" />
            <TierBar name="VIP"        sold={30}  total={40}  color="var(--hof-gold)"  sub="$1,650 · 10 left" />
          </div>
          <div style={{
            marginTop: 18, padding: '12px 0 0', borderTop: '1px solid var(--hof-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          }}>
            <span style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text-sec)' }}>
              Projected at sellout
            </span>
            <span style={{
              fontFamily: 'Clash Display, system-ui', fontWeight: 600, fontSize: 18,
              color: 'var(--hof-text)',
            }}>$9,260</span>
          </div>
        </div>
      </div>

      {/* Guest list + Photo review */}
      <div style={{
        padding: '0 28px 28px',
        display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16,
      }}>
        <GuestListWidget guests={guests} loading={loading} />
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
