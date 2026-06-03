'use client';

import { useCallback, useEffect, useState } from 'react';

interface ActivityEntry {
  t: string;
  name: string;
  meta: string;
  tone: 'amber' | 'success' | 'neutral';
  kind: 'sale' | 'scan' | 'system';
}

function activityTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

interface DoorTierOption {
  id: string;
  key: 'ga' | 'vip';
  name: string;
  price_cents: number;
}

function DoorStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'amber';
}) {
  const c = tone === 'amber' ? 'var(--hof-amber)' : 'var(--hof-text)';
  return (
    <div
      style={{
        background: 'var(--hof-surface)',
        border: '1px solid var(--hof-border)',
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          fontFamily: 'Inter, system-ui',
          fontSize: 10,
          color: 'var(--hof-text-sec)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Clash Display, system-ui',
          fontWeight: 600,
          fontSize: 22,
          color: c,
          marginTop: 4,
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'Inter, system-ui',
          fontSize: 11,
          color: 'var(--hof-text-sec)',
          marginTop: 2,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function ActivityRow({ a }: { a: ActivityEntry }) {
  const c =
    a.tone === 'amber'
      ? 'var(--hof-amber)'
      : a.tone === 'success'
        ? 'var(--hof-success)'
        : 'var(--hof-text-sec)';
  const dotBg =
    a.tone === 'amber'
      ? 'rgba(232,101,26,0.16)'
      : a.tone === 'success'
        ? 'rgba(76,175,110,0.16)'
        : 'var(--hof-elevated)';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '50px 22px 1fr',
        gap: 10,
        padding: '9px 4px',
        alignItems: 'center',
        borderBottom: '1px solid var(--hof-border)',
      }}
    >
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: 'var(--hof-text-sec)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {a.t}
      </span>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          background: dotBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {a.kind === 'sale' && (
            <path stroke={c} strokeWidth="1.5" strokeLinecap="round" d="M5 12 H19 M12 5 V19" />
          )}
          {a.kind === 'scan' && (
            <path
              stroke={c}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12 L10 17 L19 7"
            />
          )}
          {a.kind === 'system' && (
            <path
              stroke={c}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 3 L4 14 H11 L11 21 L20 10 H13 Z"
            />
          )}
        </svg>
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'Inter, system-ui',
            fontWeight: 500,
            fontSize: 13,
            color: 'var(--hof-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {a.name}
        </div>
        <div style={{ fontFamily: 'Inter, system-ui', fontSize: 11, color: 'var(--hof-text-sec)' }}>
          {a.meta}
        </div>
      </div>
    </div>
  );
}

interface SellModalProps {
  open: boolean;
  onClose: () => void;
  tiers: DoorTierOption[];
  onSold: (entry: ActivityEntry) => void;
  onRefreshStats: () => void;
}

function SellAtDoorModal({ open, onClose, tiers, onSold, onRefreshStats }: SellModalProps) {
  const [tier, setTier] = useState<'ga' | 'vip'>('ga');
  const [qty, setQty] = useState(1);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pay, setPay] = useState<'tap' | 'card' | 'cash'>('tap');
  const [stage, setStage] = useState<'form' | 'processing' | 'done'>('form');

  const gaTier = tiers.find((t) => t.key === 'ga') ?? tiers[0];
  const vipTier = tiers.find((t) => t.key === 'vip') ?? tiers[1] ?? tiers[0];
  const tierData = {
    ga: {
      name: gaTier?.name ?? 'General',
      price: (gaTier?.price_cents ?? 2800) / 100,
      id: gaTier?.id ?? '',
    },
    vip: {
      name: vipTier?.name ?? 'VIP',
      price: (vipTier?.price_cents ?? 5500) / 100,
      id: vipTier?.id ?? '',
    },
  };
  const total = (tierData[tier]?.price ?? 0) * qty;
  const valid =
    first.trim() !== '' &&
    last.trim() !== '' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    phone.replace(/\D/g, '').length >= 10;

  if (!open) return null;

  async function submit() {
    const tierId = tierData[tier]?.id;
    if (!tierId) return;
    setStage('processing');
    try {
      const res = await fetch('/api/admin/door/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier_id: tierId,
          first_name: first.trim(),
          last_name: last.trim(),
          email: email.trim(),
          qty,
          pay_method: pay,
        }),
      });
      if (!res.ok) {
        setStage('form');
        return;
      }
      const payLabel = pay === 'tap' ? 'Tap to Pay' : pay === 'card' ? 'Card' : 'Cash';
      onSold({
        t: activityTime(),
        name: `Walk-up · ${first.trim()[0] ?? ''}. ${last.trim()}`,
        meta: `${tierData[tier]?.name ?? 'GA'} · ${payLabel} · $${total.toFixed(0)}`,
        tone: 'amber',
        kind: 'sale',
      });
      onRefreshStats();
      setStage('done');
      setTimeout(() => {
        setStage('form');
        setFirst('');
        setLast('');
        setEmail('');
        setPhone('');
        setTier('ga');
        setQty(1);
        setPay('tap');
        onClose();
      }, 1100);
    } catch {
      setStage('form');
    }
  }

  function formatPhone(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    height: 42,
    padding: '0 12px',
    background: 'var(--hof-bg)',
    border: '1px solid var(--hof-border)',
    borderRadius: 8,
    fontFamily: 'Inter, system-ui',
    fontSize: 14,
    color: 'var(--hof-text)',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui',
    fontSize: 10,
    color: 'var(--hof-text-sec)',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    marginBottom: 8,
    display: 'block',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--hof-surface)',
          border: '1px solid var(--hof-border)',
          borderRadius: 14,
          color: 'var(--hof-text)',
          fontFamily: 'Inter, system-ui',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid var(--hof-border)',
            display: 'flex',
            alignItems: 'baseline',
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
              Walk-up sale
            </div>
            <div
              style={{
                fontFamily: 'Clash Display, system-ui',
                fontWeight: 600,
                fontSize: 22,
                color: 'var(--hof-text)',
                letterSpacing: '-0.01em',
                marginTop: 4,
              }}
            >
              Sell at the door
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: 'var(--hof-elevated)',
              border: '1px solid var(--hof-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                stroke="var(--hof-text-sec)"
                strokeWidth="1.5"
                strokeLinecap="round"
                d="M6 6 L18 18 M18 6 L6 18"
              />
            </svg>
          </button>
        </div>

        {stage === 'processing' && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 16px',
                borderRadius: 32,
                background: 'var(--hof-elevated)',
                border: '2px solid var(--hof-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'hof-glow 1.4s ease-in-out infinite',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect
                  stroke="var(--hof-amber)"
                  strokeWidth="1.5"
                  x="3"
                  y="6"
                  width="18"
                  height="14"
                  rx="2"
                />
                <path stroke="var(--hof-amber)" strokeWidth="1.5" d="M3 10 H21 M16 14 H18" />
              </svg>
            </div>
            <div
              style={{
                fontFamily: 'Clash Display, system-ui',
                fontWeight: 600,
                fontSize: 20,
                color: 'var(--hof-text)',
              }}
            >
              Charging ${total.toFixed(2)}…
            </div>
            <div
              style={{
                fontFamily: 'Inter, system-ui',
                fontSize: 12,
                color: 'var(--hof-text-sec)',
                marginTop: 6,
              }}
            >
              Awaiting tap. Hold the card or phone near the reader.
            </div>
          </div>
        )}

        {stage === 'done' && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 16px',
                borderRadius: 32,
                background: 'rgba(76,175,110,0.15)',
                border: '2px solid var(--hof-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  stroke="var(--hof-success)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12 L10 17 L19 7"
                />
              </svg>
            </div>
            <div
              style={{
                fontFamily: 'Clash Display, system-ui',
                fontWeight: 600,
                fontSize: 20,
                color: 'var(--hof-text)',
              }}
            >
              Approved
            </div>
            <div
              style={{
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: 'var(--hof-text-sec)',
                marginTop: 6,
              }}
            >
              Ticket sent to {first || 'buyer'}. Wave them in.
            </div>
          </div>
        )}

        {stage === 'form' && (
          <div style={{ padding: 22 }}>
            {/* Tier */}
            <label style={labelStyle}>Tier</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(
                Object.entries(tierData) as Array<['ga' | 'vip', { name: string; price: number }]>
              ).map(([id, t]) => (
                <button
                  key={id}
                  onClick={() => setTier(id)}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: tier === id ? 'var(--hof-elevated)' : 'var(--hof-bg)',
                    border:
                      tier === id ? '2px solid var(--hof-amber)' : '1px solid var(--hof-border)',
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Inter, system-ui',
                        fontWeight: 500,
                        fontSize: 14,
                        color: 'var(--hof-text)',
                      }}
                    >
                      {t.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Clash Display, system-ui',
                        fontWeight: 600,
                        fontSize: 18,
                        color: 'var(--hof-text)',
                      }}
                    >
                      ${t.price}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Quantity */}
            <div
              style={{
                marginTop: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--hof-bg)',
                border: '1px solid var(--hof-border)',
                borderRadius: 10,
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
                  Quantity
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontSize: 12,
                    color: 'var(--hof-text-sec)',
                  }}
                >
                  Max 4 per buyer
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: 'var(--hof-elevated)',
                    border: '1px solid var(--hof-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      stroke={qty === 1 ? 'var(--hof-text-dis)' : 'var(--hof-text)'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      d="M5 12 H19"
                    />
                  </svg>
                </button>
                <span
                  style={{
                    fontFamily: 'Clash Display, system-ui',
                    fontWeight: 600,
                    fontSize: 18,
                    color: 'var(--hof-text)',
                    width: 22,
                    textAlign: 'center',
                  }}
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty(Math.min(4, qty + 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: 'var(--hof-amber)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      stroke="var(--hof-bg)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      d="M5 12 H19 M12 5 V19"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Buyer details */}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>First name</label>
                <input
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                  placeholder="First"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Last name</label>
                <input
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                  placeholder="Last"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Email (for ticket receipt)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@example.com"
                style={inputStyle}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(555) 123-4567"
                style={inputStyle}
              />
            </div>

            {/* Payment */}
            <div style={{ marginTop: 18 }}>
              <label style={labelStyle}>Payment</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(
                  [
                    ['tap', 'Tap to Pay', 'Apple / Google'],
                    ['card', 'Card reader', 'Insert / tap'],
                    ['cash', 'Cash', 'Log to register'],
                  ] as const
                ).map(([id, title, sub]) => (
                  <button
                    key={id}
                    onClick={() => setPay(id)}
                    style={{
                      padding: '12px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: pay === id ? 'var(--hof-elevated)' : 'var(--hof-bg)',
                      border:
                        pay === id ? '2px solid var(--hof-amber)' : '1px solid var(--hof-border)',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'Inter, system-ui',
                        fontWeight: 500,
                        fontSize: 13,
                        color: 'var(--hof-text)',
                        marginTop: 4,
                      }}
                    >
                      {title}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Inter, system-ui',
                        fontSize: 11,
                        color: 'var(--hof-text-sec)',
                        marginTop: 2,
                      }}
                    >
                      {sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div
              style={{
                marginTop: 22,
                padding: '16px 18px',
                background: 'var(--hof-bg)',
                border: '1px solid var(--hof-border)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, system-ui',
                  fontSize: 12,
                  color: 'var(--hof-text-sec)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                }}
              >
                Total · {qty} {qty === 1 ? 'ticket' : 'tickets'}
              </span>
              <span
                style={{
                  fontFamily: 'Clash Display, system-ui',
                  fontWeight: 600,
                  fontSize: 26,
                  color: 'var(--hof-text)',
                  letterSpacing: '-0.01em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                ${total.toFixed(2)}
              </span>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                disabled={!valid}
                onClick={() => void submit()}
                style={{
                  width: '100%',
                  height: 46,
                  background: valid ? 'var(--hof-amber)' : 'var(--hof-elevated)',
                  border: 'none',
                  borderRadius: 8,
                  cursor: valid ? 'pointer' : 'not-allowed',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 14,
                  fontWeight: 600,
                  color: valid ? 'var(--hof-bg)' : 'var(--hof-text-sec)',
                }}
              >
                {valid ? `Charge $${total.toFixed(2)}` : 'Fill in buyer details'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoorPage() {
  const [scanCode, setScanCode] = useState('');
  const [scanResult, setScanResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [tiers, setTiers] = useState<DoorTierOption[]>([]);
  const [headerEdition, setHeaderEdition] = useState('Loading…');
  const [headerSub, setHeaderSub] = useState('');
  const [statSold, setStatSold] = useState('—');
  const [statScanned, setStatScanned] = useState('—');
  const [statScannedSub, setStatScannedSub] = useState('');
  const [statWalkupCount, setStatWalkupCount] = useState('—');
  const [statWalkupSub, setStatWalkupSub] = useState('');
  const [statRemaining, setStatRemaining] = useState('—');

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/door/stats');
      if (!res.ok) return;
      const data = (await res.json()) as {
        event: {
          name: string;
          edition_number: number;
          venue_name: string;
          doors_open: string;
        };
        stats: {
          sold: number;
          scanned: number;
          walkupCount: number;
          walkupGrossCents: number;
          remaining: number;
          capacity: number;
        };
        tiers: DoorTierOption[];
      };
      setTiers(data.tiers ?? []);
      setHeaderEdition(`${data.event.name} · Edition ${data.event.edition_number}`);
      setHeaderSub(`Doors open ${data.event.doors_open} · ${data.event.venue_name}`);
      const pct =
        data.stats.sold > 0 ? Math.round((data.stats.scanned / data.stats.sold) * 100) : 0;
      setStatSold(String(data.stats.sold));
      setStatScanned(String(data.stats.scanned));
      setStatScannedSub(data.stats.sold > 0 ? `${pct}% in` : '');
      setStatWalkupCount(String(data.stats.walkupCount));
      setStatWalkupSub(
        data.stats.walkupCount > 0
          ? `$${(data.stats.walkupGrossCents / 100).toFixed(0)} cash + card`
          : 'none yet',
      );
      setStatRemaining(String(data.stats.remaining));
    } catch {
      /* keep placeholders */
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  function prependActivity(entry: ActivityEntry) {
    setActivity((prev) => [entry, ...prev].slice(0, 30));
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!scanCode.trim()) return;
    const code = scanCode.trim();
    try {
      const res = await fetch('/api/admin/door/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        const data = (await res.json()) as { code?: string };
        setScanResult({ ok: true, message: 'Checked in successfully.' });
        prependActivity({
          t: activityTime(),
          name: data.code ?? code,
          meta: 'Scanned in',
          tone: 'success',
          kind: 'scan',
        });
        void loadStats();
      } else {
        const data = (await res.json()) as { error?: string };
        setScanResult({ ok: false, message: data.error ?? 'Error checking in.' });
      }
    } catch {
      setScanResult({ ok: false, message: 'Network error.' });
    }
    setScanCode('');
  }

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
            Door · Tonight
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
            {headerEdition}
          </div>
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text-sec)',
              marginTop: 4,
            }}
          >
            {headerSub || '—'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 6,
              background: 'rgba(76,175,110,0.10)',
              border: '1px solid rgba(76,175,110,0.3)',
              fontFamily: 'Inter, system-ui',
              fontSize: 11,
              color: 'var(--hof-success)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: 'var(--hof-success)',
                animation: 'hof-pulse 1.4s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            Scanner live
          </span>
        </div>
      </div>

      <div style={{ padding: '20px 28px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          {/* Scanner side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Scanner input */}
            <div
              style={{
                background: 'var(--hof-surface)',
                border: '1px solid var(--hof-border)',
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter, system-ui',
                  fontSize: 10,
                  color: 'var(--hof-amber)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                QR Scanner
              </div>
              <form
                onSubmit={(e) => {
                  void handleScan(e);
                }}
                style={{ display: 'flex', gap: 8 }}
              >
                <input
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  placeholder="Scan or type ticket code (e.g. HOF-24-0001)"
                  autoFocus
                  style={{
                    flex: 1,
                    height: 44,
                    padding: '0 14px',
                    background: 'var(--hof-bg)',
                    border: '1px solid var(--hof-border)',
                    borderRadius: 8,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 13,
                    color: 'var(--hof-text)',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0 20px',
                    height: 44,
                    borderRadius: 8,
                    background: 'var(--hof-amber)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--hof-bg)',
                  }}
                >
                  Check In
                </button>
              </form>
              {scanResult && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: scanResult.ok ? 'rgba(76,175,110,0.12)' : 'rgba(232,74,26,0.12)',
                    border: scanResult.ok
                      ? '1px solid rgba(76,175,110,0.3)'
                      : '1px solid rgba(232,74,26,0.3)',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 13,
                    color: scanResult.ok ? 'var(--hof-success)' : 'var(--hof-error)',
                  }}
                >
                  {scanResult.message}
                </div>
              )}
            </div>

            {/* Door stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <DoorStat label="Sold" value={statSold} sub="online" />
              <DoorStat
                label="Scanned"
                value={statScanned}
                sub={statScannedSub || 'checked in'}
                tone="amber"
              />
              <DoorStat
                label="Walk-ups"
                value={statWalkupCount}
                sub={statWalkupSub || 'walk-ups'}
              />
              <DoorStat label="Remaining" value={statRemaining} sub="capacity left" />
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Sell at door card */}
            <div
              style={{
                padding: 20,
                background:
                  'linear-gradient(155deg, rgba(232,101,26,0.16) 0%, var(--hof-surface) 60%)',
                border: '1px solid var(--hof-border)',
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter, system-ui',
                  fontSize: 10,
                  color: 'var(--hof-amber)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                }}
              >
                Walk-up sales
              </div>
              <div
                style={{
                  fontFamily: 'Clash Display, system-ui',
                  fontWeight: 600,
                  fontSize: 24,
                  color: 'var(--hof-text)',
                  letterSpacing: '-0.01em',
                  marginTop: 6,
                  lineHeight: 1.2,
                }}
              >
                Friend showed up
                <br />
                without a ticket?
              </div>
              <div
                style={{
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  color: 'var(--hof-text-sec)',
                  marginTop: 8,
                }}
              >
                Capture their details, charge a card, add them to the guest list — in under a
                minute.
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 8,
                    background: 'var(--hof-amber)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--hof-bg)',
                  }}
                >
                  + Sell at the door
                </button>
              </div>
            </div>

            {/* Activity feed */}
            <div
              style={{
                background: 'var(--hof-surface)',
                border: '1px solid var(--hof-border)',
                borderRadius: 12,
                padding: '16px 18px',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter, system-ui',
                  fontSize: 10,
                  color: 'var(--hof-text-sec)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                Live activity
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activity.map((a, i) => (
                  <ActivityRow key={i} a={a} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SellAtDoorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tiers={tiers}
        onSold={prependActivity}
        onRefreshStats={() => void loadStats()}
      />
    </>
  );
}
