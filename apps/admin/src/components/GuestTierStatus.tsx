'use client';

import { TierBar } from '@/components/TierBar';

export type TierStatusRow = {
  tier_id: string;
  name: string;
  display_name: string;
  capacity: number;
  sold: number;
  remaining: number;
  tier_status: string;
};

export type EventTierStatusGroup = {
  event_id: string;
  edition_number: number;
  name: string;
  status: string;
  tiers: TierStatusRow[];
};

const TIER_COLORS = ['var(--hof-amber)', 'var(--hof-gold)', 'var(--hof-info)', 'var(--hof-ember)'];

interface GuestTierStatusProps {
  events: EventTierStatusGroup[];
  loading: boolean;
  scopeLabel: string;
}

export function GuestTierStatus({ events, loading, scopeLabel }: GuestTierStatusProps) {
  const totalSold = events.reduce((s, e) => s + e.tiers.reduce((t, tier) => t + tier.sold, 0), 0);
  const totalRemaining = events.reduce(
    (s, e) => s + e.tiers.reduce((t, tier) => t + tier.remaining, 0),
    0,
  );

  return (
    <div
      style={{
        margin: '0 28px 20px',
        background: 'var(--hof-surface)',
        border: '1px solid var(--hof-border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 18px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              color: 'var(--hof-text-sec)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Tier status
          </div>
          <div
            style={{
              fontFamily: 'Clash Display, system-ui',
              fontWeight: 600,
              fontSize: 16,
              color: 'var(--hof-text)',
              marginTop: 4,
            }}
          >
            {scopeLabel}
          </div>
        </div>
        {!loading && events.length > 0 && (
          <div style={{ display: 'flex', gap: 20 }}>
            <Stat label="Guests (sold)" value={totalSold} />
            <Stat label="Remaining" value={totalRemaining} />
          </div>
        )}
      </div>

      <div style={{ padding: '16px 18px 18px' }}>
        {loading && (
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              color: 'var(--hof-text-sec)',
            }}
          >
            Loading tier inventory…
          </div>
        )}

        {!loading && events.length === 0 && (
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              color: 'var(--hof-text-sec)',
            }}
          >
            No ticket tiers found for this scope.
          </div>
        )}

        {!loading &&
          events.map((ev) => (
            <div
              key={ev.event_id}
              style={{
                marginBottom: events.length > 1 ? 20 : 0,
              }}
            >
              {events.length > 1 && (
                <div
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--hof-text)',
                    marginBottom: 12,
                    letterSpacing: '0.02em',
                  }}
                >
                  Edition {ev.edition_number} · {ev.name}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  width: '100%',
                }}
              >
                {ev.tiers.map((tier, i) => (
                  <div key={tier.tier_id} style={{ flex: 1, minWidth: 0 }}>
                    <TierBar
                      name={tier.display_name || tier.name}
                      sold={tier.sold}
                      total={tier.capacity}
                      color={TIER_COLORS[i % TIER_COLORS.length]}
                      sub={`${tier.remaining} remaining${tier.tier_status === 'sold_out' ? ' · Sold out' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div
        style={{
          fontFamily: 'Inter, system-ui',
          fontSize: 10,
          color: 'var(--hof-text-sec)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--hof-text)',
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
