'use client';

import { useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Pill } from '@/components/Pill';

interface GuestApiRow {
  id: string;
  code: string;
  amount_cents: number;
  status: 'valid' | 'used' | 'transferred' | 'refunded' | 'cancelled';
  purchased_at: string;
  profiles: { display_name: string; handle: string; avatar_url: string | null } | null;
  ticket_tiers: { display_name: string; name: string } | null;
}

interface GuestRow {
  id: string;
  name: string;
  email: string;
  tier: string;
  status: 'valid' | 'used' | 'transferred' | 'refunded' | 'cancelled';
  purchased: string;
}

function mapGuest(g: GuestApiRow): GuestRow {
  const name = g.profiles?.display_name ?? g.profiles?.handle ?? 'Unknown';
  const email = g.profiles?.handle ?? '—';
  const tier = g.ticket_tiers?.display_name ?? g.ticket_tiers?.name ?? 'General';
  const purchased = new Date(g.purchased_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return { id: g.id, name, email, tier, status: g.status, purchased };
}

function statusTone(status: GuestRow['status']): 'success' | 'danger' | 'neutral' | 'warning' {
  if (status === 'used' || status === 'valid') return 'success';
  if (status === 'refunded' || status === 'cancelled') return 'danger';
  if (status === 'transferred') return 'warning';
  return 'neutral';
}

export default function GuestsPage() {
  const [search, setSearch] = useState('');
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/guests');
        const data = (await res.json()) as { guests?: GuestApiRow[]; error?: string };
        if (data.error) {
          setError(data.error);
        } else {
          setGuests((data.guests ?? []).map(mapGuest));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load guests');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filtered = guests.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
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
            {loading ? 'Loading…' : `${guests.length} confirmed`}
          </div>
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text-sec)',
              marginTop: 4,
            }}
          >
            All editions
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 8,
            width: 280,
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      <div style={{ padding: '20px 28px 28px' }}>
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
              gridTemplateColumns: '2fr 1.2fr 0.7fr 0.7fr 0.8fr',
              padding: '12px 18px',
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
                padding: '24px 18px',
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
            filtered.map((g, i) => {
              const initials = g.name
                .split(' ')
                .map((p) => p[0] ?? '')
                .join('');
              const isVip = g.tier.toLowerCase().includes('vip');
              return (
                <div
                  key={g.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 0.7fr 0.7fr 0.8fr',
                    padding: '12px 18px',
                    alignItems: 'center',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--hof-border)' : 'none',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 13,
                    color: 'var(--hof-text)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={initials} size={28} />
                    <span style={{ fontWeight: 500 }}>{g.name}</span>
                  </div>
                  <div style={{ color: 'var(--hof-text-sec)', fontSize: 12 }}>{g.email}</div>
                  <div>
                    <Pill tone={isVip ? 'gold' : 'neutral'} size="sm">
                      {g.tier}
                    </Pill>
                  </div>
                  <div>
                    <Pill tone={statusTone(g.status)} size="sm">
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
                    {g.purchased}
                  </div>
                </div>
              );
            })}
          {!loading && filtered.length === 0 && (
            <div
              style={{
                padding: '24px 18px',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: 'var(--hof-text-sec)',
                textAlign: 'center',
              }}
            >
              No guests match your search.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
