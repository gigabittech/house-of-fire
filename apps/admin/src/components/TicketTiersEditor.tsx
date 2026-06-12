'use client';

import type { TierFormRow, TierStatus } from '@/lib/tierPayload';

const TIER_STATUSES: Array<{ value: TierStatus; label: string }> = [
  { value: 'available', label: 'Active' },
  { value: 'sold_out', label: 'Sold out' },
  { value: 'hidden', label: 'Hidden' },
];

function emptyTier(sortOrder: number): TierFormRow {
  return {
    display_name: '',
    name: '',
    description: null,
    price_cents: 0,
    fee_cents: 0,
    capacity: 0,
    status: 'available',
    sort_order: sortOrder,
  };
}

function centsToDollars(cents: number): string {
  if (cents === 0) return '';
  return (cents / 100).toFixed(2);
}

function dollarsToCents(value: string): number {
  const n = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

interface TicketTiersEditorProps {
  tiers: TierFormRow[];
  onChange: (tiers: TierFormRow[]) => void;
  soldByTierId?: Record<string, number>;
}

export function TicketTiersEditor({ tiers, onChange, soldByTierId = {} }: TicketTiersEditorProps) {
  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui',
    fontSize: 10,
    color: 'var(--hof-text-sec)',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    marginBottom: 6,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    height: 38,
    padding: '0 10px',
    background: 'var(--hof-bg)',
    border: '1px solid var(--hof-border)',
    borderRadius: 8,
    fontFamily: 'Inter, system-ui',
    fontSize: 13,
    color: 'var(--hof-text)',
    outline: 'none',
  };

  const totalCapacity = tiers
    .filter((t) => t.status !== 'hidden')
    .reduce((sum, t) => sum + (t.capacity || 0), 0);

  function updateTier(index: number, patch: Partial<TierFormRow>) {
    onChange(tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function moveTier(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= tiers.length) return;
    const copy = [...tiers];
    const a = copy[index];
    const b = copy[next];
    if (a === undefined || b === undefined) return;
    copy[index] = b;
    copy[next] = a;
    onChange(copy.map((t, i) => ({ ...t, sort_order: i })));
  }

  function removeTier(index: number) {
    const tier = tiers[index];
    if (tier?.id && (soldByTierId[tier.id] ?? 0) > 0) return;
    onChange(tiers.filter((_, i) => i !== index).map((t, i) => ({ ...t, sort_order: i })));
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 12,
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
            Ticket tiers
          </div>
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text-sec)',
              marginTop: 4,
            }}
          >
            Event capacity (auto): {totalCapacity} tickets
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange([...tiers, emptyTier(tiers.length)])}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: 'var(--hof-elevated)',
            border: '1px solid var(--hof-border)',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--hof-text)',
          }}
        >
          + Add tier
        </button>
      </div>

      {tiers.length === 0 ? (
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            border: '1px dashed var(--hof-border)',
            fontFamily: 'Inter, system-ui',
            fontSize: 13,
            color: 'var(--hof-text-sec)',
            textAlign: 'center',
          }}
        >
          No tiers yet. Add at least one tier before publishing tickets.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tiers.map((tier, index) => {
            const sold = tier.id ? (soldByTierId[tier.id] ?? 0) : 0;
            const remaining = Math.max(0, tier.capacity - sold);
            return (
              <div
                key={tier.id ?? `new-${index}`}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: '1px solid var(--hof-border)',
                  background: 'var(--hof-bg)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, system-ui',
                      fontSize: 11,
                      color: 'var(--hof-text-sec)',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Tier {index + 1}
                    {sold > 0 ? ` · ${sold} sold · ${remaining} left` : ''}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveTier(index, -1)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: '1px solid var(--hof-border)',
                        background: 'var(--hof-surface)',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        opacity: index === 0 ? 0.4 : 1,
                      }}
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === tiers.length - 1}
                      onClick={() => moveTier(index, 1)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: '1px solid var(--hof-border)',
                        background: 'var(--hof-surface)',
                        cursor: index === tiers.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: index === tiers.length - 1 ? 0.4 : 1,
                      }}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      disabled={sold > 0}
                      onClick={() => removeTier(index)}
                      title={sold > 0 ? 'Cannot remove tier with sales' : 'Remove tier'}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: '1px solid var(--hof-border)',
                        background: 'var(--hof-surface)',
                        cursor: sold > 0 ? 'not-allowed' : 'pointer',
                        opacity: sold > 0 ? 0.4 : 1,
                        color: 'var(--hof-error, #e55)',
                      }}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Tier name</label>
                    <input
                      style={inputStyle}
                      value={tier.display_name}
                      onChange={(e) => updateTier(index, { display_name: e.target.value })}
                      placeholder="Early Bird, GA, VIP…"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select
                      style={inputStyle}
                      value={tier.status}
                      onChange={(e) => updateTier(index, { status: e.target.value as TierStatus })}
                    >
                      {TIER_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Ticket price ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      style={inputStyle}
                      value={centsToDollars(tier.price_cents)}
                      onChange={(e) =>
                        updateTier(index, { price_cents: dollarsToCents(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Service fee ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      style={inputStyle}
                      value={centsToDollars(tier.fee_cents)}
                      onChange={(e) =>
                        updateTier(index, { fee_cents: dollarsToCents(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Capacity</label>
                    <input
                      type="number"
                      min={0}
                      style={inputStyle}
                      value={tier.capacity}
                      onChange={(e) =>
                        updateTier(index, { capacity: Number.parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Description (optional)</label>
                  <input
                    style={inputStyle}
                    value={tier.description ?? ''}
                    onChange={(e) =>
                      updateTier(index, { description: e.target.value.trim() || null })
                    }
                    placeholder="Inclusive of fees, perks, door window…"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
