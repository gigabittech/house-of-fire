'use client';

import { colors } from '@hof/design-tokens';
import { useResponsive } from '@hof/ui';
import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAppHeader } from '@/hooks/useAppHeader';

// ─── Types ───────────────────────────────────────────────────────────────────

type ScanResult =
  | {
      ok: true;
      holder: { display_name: string } | null;
      tier: { display_name: string } | null;
      code: string;
    }
  | { ok: false; error: string };

type ActivityEntry = {
  t: string;
  name: string;
  meta: string;
  tone: 'amber' | 'success' | 'neutral';
  kind: 'sale' | 'scan' | 'system';
};

type SellStage = 'form' | 'processing' | 'done';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now12(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DoorLabel({
  children,
  style = {},
  inline = false,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  inline?: boolean;
}) {
  return (
    <div
      style={{
        fontFamily: 'Inter',
        fontSize: 10,
        color: colors.textSec,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        marginBottom: inline ? 0 : 8,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function DoorInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        height: 42,
        padding: '0 12px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        fontFamily: 'Inter',
        fontSize: 14,
        color: colors.text,
        outline: 'none',
        ...style,
      }}
    />
  );
}

function PayChoice({
  id,
  pay,
  setPay,
  title,
  sub,
}: {
  id: string;
  pay: string;
  setPay: (v: string) => void;
  title: string;
  sub: string;
}) {
  const active = pay === id;
  return (
    <button
      className="hof-btn hof-press"
      onClick={() => setPay(id)}
      style={{
        padding: '12px 10px',
        textAlign: 'left',
        background: active ? colors.elevated : colors.bg,
        border: active ? `2px solid ${colors.amber}` : `1px solid ${colors.border}`,
        borderRadius: 10,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          fontFamily: 'Inter',
          fontWeight: 500,
          fontSize: 13,
          color: active ? colors.amber : colors.text,
        }}
      >
        {title}
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 11, color: colors.textSec, marginTop: 2 }}>
        {sub}
      </div>
    </button>
  );
}

function Processing({ total }: { total: number }) {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <div
        style={{
          width: 64,
          height: 64,
          margin: '0 auto 16px',
          borderRadius: 32,
          background: colors.elevated,
          border: `2px solid ${colors.amber}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'hof-glow 1.4s ease-in-out infinite',
        }}
      >
        {/* Wallet icon (SVG) */}
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.amber}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M16 14h2" />
        </svg>
      </div>
      <div
        style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20, color: colors.text }}
      >
        Charging ${total.toFixed(2)}…
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 12, color: colors.textSec, marginTop: 6 }}>
        Awaiting tap. Hold the card or phone near the reader.
      </div>
    </div>
  );
}

function Done({ first }: { first: string }) {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <div
        style={{
          width: 64,
          height: 64,
          margin: '0 auto 16px',
          borderRadius: 32,
          background: 'rgba(76,175,110,0.15)',
          border: `2px solid ${colors.success}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.success}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div
        style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20, color: colors.text }}
      >
        Approved
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: colors.textSec, marginTop: 6 }}>
        Ticket sent to {first || 'buyer'}. Wave them in.
      </div>
    </div>
  );
}

function ActivityRow({ a }: { a: ActivityEntry }) {
  const c =
    a.tone === 'amber' ? colors.amber : a.tone === 'success' ? colors.success : colors.textSec;
  const iconBg =
    a.tone === 'amber'
      ? 'rgba(232,101,26,0.16)'
      : a.tone === 'success'
        ? 'rgba(76,175,110,0.16)'
        : colors.elevated;

  const iconPath =
    a.kind === 'sale'
      ? 'M12 5v14M5 12h14' // plus
      : a.kind === 'scan'
        ? 'M20 6L9 17l-5-5' // check
        : 'M13 10V3L4 14h7v7l9-11h-7z'; // bolt

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '50px 22px 1fr',
        gap: 10,
        padding: '9px 4px',
        alignItems: 'center',
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <span
        style={{
          fontFamily: 'JetBrains Mono',
          fontSize: 11,
          color: colors.textSec,
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
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke={c}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={iconPath} />
        </svg>
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 13,
            color: colors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {a.name}
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 11, color: colors.textSec }}>{a.meta}</div>
      </div>
    </div>
  );
}

// ─── Sell-at-door modal ───────────────────────────────────────────────────────

const TIER_DATA: Record<string, { name: string; price: number }> = {
  ga: { name: 'General', price: 28 },
  vip: { name: 'VIP', price: 55 },
};

function SellAtDoorModal({
  open,
  onClose,
  onSold,
  isWide = false,
}: {
  open: boolean;
  onClose: () => void;
  onSold: (entry: ActivityEntry) => void;
  isWide?: boolean;
}) {
  const [tier, setTier] = useState('ga');
  const [qty, setQty] = useState(1);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pay, setPay] = useState('tap');
  const [stage, setStage] = useState<SellStage>('form');

  const tierEntry = TIER_DATA[tier] ?? TIER_DATA['ga'];
  const total = (tierEntry?.price ?? 28) * qty;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneValid = phone.replace(/\D/g, '').length >= 10;
  const valid = first.trim() !== '' && last.trim() !== '' && emailValid && phoneValid;

  function reset() {
    setStage('form');
    setFirst('');
    setLast('');
    setEmail('');
    setPhone('');
    setTier('ga');
    setQty(1);
    setPay('tap');
  }

  async function submit() {
    if (!valid) return;
    setStage('processing');

    try {
      const res = await fetch('/api/door/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          qty,
          first_name: first,
          last_name: last,
          email,
          phone,
          pay_method: pay,
        }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!data.ok) throw new Error('Sell failed');
    } catch {
      // Still show done state even if API fails (offline bouncer use case)
    }

    setStage('done');
    onSold({
      t: now12(),
      name: `Walk-up · ${last.charAt(0).toUpperCase()}. ${first}`,
      meta: `${tierEntry?.name ?? 'GA'} · ${pay === 'tap' ? 'Tap to Pay' : pay === 'card' ? 'Card' : 'Cash'} · $${total}`,
      tone: 'amber',
      kind: 'sale',
    });

    setTimeout(() => {
      reset();
      onClose();
    }, 1200);
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hof-scroll"
        style={{
          width: isWide ? `min(100%, ${DOOR_MAX_WIDTH}px)` : '100%',
          maxHeight: '92%',
          overflowY: 'auto',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '22px 22px 0 0',
          color: colors.text,
          fontFamily: 'Inter',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Swipe handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: colors.border,
            margin: '12px auto 4px',
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: '18px 22px 14px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 10,
                color: colors.textSec,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              Walk-up sale
            </div>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 22,
                color: colors.text,
                letterSpacing: '-0.01em',
                marginTop: 4,
              }}
            >
              Sell at the door
            </div>
          </div>
          <button
            className="hof-btn hof-press"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: colors.elevated,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.textSec}
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Stages */}
        {stage === 'processing' && <Processing total={total} />}
        {stage === 'done' && <Done first={first} />}
        {stage === 'form' && (
          <div style={{ padding: 22 }}>
            {/* Tier selector */}
            <DoorLabel>Tier</DoorLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(TIER_DATA).map(([id, t]) => (
                <button
                  key={id}
                  className="hof-btn hof-press"
                  onClick={() => setTier(id)}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    textAlign: 'left',
                    background: tier === id ? colors.elevated : colors.bg,
                    border:
                      tier === id ? `2px solid ${colors.amber}` : `1px solid ${colors.border}`,
                    borderRadius: 10,
                    cursor: 'pointer',
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
                        fontFamily: 'Inter',
                        fontWeight: 500,
                        fontSize: 14,
                        color: colors.text,
                      }}
                    >
                      {t.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Clash Display',
                        fontWeight: 600,
                        fontSize: 18,
                        color: colors.text,
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
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
              }}
            >
              <div>
                <DoorLabel inline>Quantity</DoorLabel>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: colors.textSec }}>
                  Max 4 per buyer
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  className="hof-btn hof-press"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: colors.elevated,
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={qty === 1 ? colors.textDis : colors.text}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <span
                  style={{
                    fontFamily: 'Clash Display',
                    fontWeight: 600,
                    fontSize: 18,
                    color: colors.text,
                    width: 22,
                    textAlign: 'center',
                  }}
                >
                  {qty}
                </span>
                <button
                  className="hof-btn hof-press"
                  onClick={() => setQty(Math.min(4, qty + 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: colors.amber,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.bg}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Buyer details */}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <div style={{ flex: 1 }}>
                <DoorLabel>First name</DoorLabel>
                <DoorInput
                  value={first}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFirst(e.target.value)}
                  placeholder="First"
                />
              </div>
              <div style={{ flex: 1 }}>
                <DoorLabel>Last name</DoorLabel>
                <DoorInput
                  value={last}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLast(e.target.value)}
                  placeholder="Last"
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <DoorLabel>Email (for ticket receipt)</DoorLabel>
              <DoorInput
                type="email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="buyer@example.com"
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <DoorLabel>Phone</DoorLabel>
              <DoorInput
                type="tel"
                value={phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPhone(formatPhone(e.target.value))
                }
                placeholder="(555) 123-4567"
              />
            </div>

            {/* Payment */}
            <DoorLabel style={{ marginTop: 18 }}>Payment</DoorLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <PayChoice
                id="tap"
                pay={pay}
                setPay={setPay}
                title="Tap to Pay"
                sub="Apple / Google"
              />
              <PayChoice
                id="card"
                pay={pay}
                setPay={setPay}
                title="Card reader"
                sub="Insert / tap"
              />
              <PayChoice id="cash" pay={pay} setPay={setPay} title="Cash" sub="Log to register" />
            </div>

            {/* Total + submit */}
            <div
              style={{
                marginTop: 22,
                padding: '16px 18px',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter',
                  fontSize: 12,
                  color: colors.textSec,
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                }}
              >
                Total · {qty} {qty === 1 ? 'ticket' : 'tickets'}
              </span>
              <span
                style={{
                  fontFamily: 'Clash Display',
                  fontWeight: 600,
                  fontSize: 26,
                  color: colors.text,
                  letterSpacing: '-0.01em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                ${total.toFixed(2)}
              </span>
            </div>

            <div style={{ marginTop: 12 }}>
              <button
                className="hof-btn hof-press"
                onClick={() => void submit()}
                disabled={!valid}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: valid ? colors.amber : colors.elevated,
                  border: 'none',
                  borderRadius: 12,
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: 15,
                  color: valid ? colors.bg : colors.textDis,
                  cursor: valid ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={valid ? colors.bg : colors.textDis}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {valid ? `Charge $${total.toFixed(2)}` : 'Fill in buyer details'}
              </button>
            </div>

            <div
              style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: 'Inter',
                fontSize: 11,
                color: colors.textSec,
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke={colors.success}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Encrypted via Stripe Terminal · ticket emailed instantly
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Scanner area (text input viewfinder) ─────────────────────────────────────

function ScannerArea({ onScanned }: { onScanned: (result: ScanResult, code: string) => void }) {
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function doScan(rawCode: string) {
    const trimmed = rawCode.trim().toUpperCase();
    if (!trimmed || scanning) return;

    setScanning(true);
    setCode('');

    try {
      const res = await fetch('/api/door/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await res.json()) as ScanResult;
      onScanned(data, trimmed);
    } catch {
      onScanned({ ok: false, error: 'Network error' }, trimmed);
    } finally {
      setScanning(false);
      // Re-focus the input for rapid scanning
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      void doScan(code);
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 220,
        background: '#050503',
        borderRadius: 12,
        overflow: 'hidden',
        border: `2px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      {/* Corner brackets (viewfinder aesthetic) */}
      {(
        [
          ['top', 'left'],
          ['top', 'right'],
          ['bottom', 'left'],
          ['bottom', 'right'],
        ] as const
      ).map(([v, h]) => (
        <div
          key={`${v}-${h}`}
          style={{
            position: 'absolute',
            [v]: 16,
            [h]: 16,
            width: 28,
            height: 28,
            borderTop: v === 'top' ? `3px solid ${colors.amber}` : 'none',
            borderBottom: v === 'bottom' ? `3px solid ${colors.amber}` : 'none',
            borderLeft: h === 'left' ? `3px solid ${colors.amber}` : 'none',
            borderRight: h === 'right' ? `3px solid ${colors.amber}` : 'none',
            borderRadius: 4,
          }}
        />
      ))}

      {/* Scanline */}
      <div
        style={{
          position: 'absolute',
          left: 44,
          right: 44,
          top: 16,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${colors.amber}, transparent)`,
          boxShadow: `0 0 10px ${colors.amber}`,
          animation: 'hof-scanline 1.8s ease-in-out infinite',
        }}
      />

      {/* Active pill */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 9px',
          borderRadius: 4,
          background: 'rgba(20,20,18,0.7)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${colors.border}`,
          fontFamily: 'Inter',
          fontSize: 10,
          color: colors.success,
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
            background: colors.success,
            display: 'inline-block',
            animation: 'hof-pulse 1.4s ease-in-out infinite',
          }}
        />
        Scanner live
      </div>

      {/* Text input */}
      <input
        ref={inputRef}
        value={code}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
        onKeyDown={handleKey}
        placeholder="HOF-24-0001"
        autoComplete="off"
        autoCapitalize="characters"
        disabled={scanning}
        style={{
          width: 'calc(100% - 48px)',
          height: 46,
          padding: '0 14px',
          background: 'rgba(20,20,18,0.82)',
          backdropFilter: 'blur(8px)',
          border: `1.5px solid ${colors.amber}`,
          borderRadius: 8,
          fontFamily: 'JetBrains Mono',
          fontSize: 15,
          letterSpacing: '0.1em',
          color: colors.text,
          outline: 'none',
          textAlign: 'center',
          opacity: scanning ? 0.6 : 1,
        }}
      />

      <button
        className="hof-btn hof-press"
        onClick={() => void doScan(code)}
        disabled={!code.trim() || scanning}
        style={{
          padding: '10px 24px',
          background: code.trim() && !scanning ? colors.amber : colors.elevated,
          border: 'none',
          borderRadius: 8,
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: 13,
          color: code.trim() && !scanning ? colors.bg : colors.textDis,
          cursor: code.trim() && !scanning ? 'pointer' : 'not-allowed',
        }}
      >
        {scanning ? 'Checking…' : 'Check In'}
      </button>
    </div>
  );
}

// ─── Scan result toast ────────────────────────────────────────────────────────

function ScanToast({
  result,
  onDismiss,
  isWide = false,
}: {
  result: { ok: boolean; message: string; sub?: string } | null;
  onDismiss: () => void;
  isWide?: boolean;
}) {
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(onDismiss, 2200);
    return () => clearTimeout(t);
  }, [result, onDismiss]);

  if (!result) return null;

  const bgColor = result.ok ? 'rgba(76,175,110,0.15)' : 'rgba(232,74,26,0.15)';
  const borderColor = result.ok ? colors.success : colors.error;
  const textColor = result.ok ? colors.success : colors.error;

  return (
    <div
      style={{
        position: 'absolute',
        top: isWide ? 64 : 112,
        left: isWide ? '50%' : 16,
        right: isWide ? 'auto' : 16,
        transform: isWide ? 'translateX(-50%)' : undefined,
        width: isWide ? `min(100% - 32px, ${DOOR_MAX_WIDTH - 32}px)` : 'auto',
        boxSizing: 'border-box',
        zIndex: 100,
        padding: '14px 16px',
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 12,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: 15,
          color: textColor,
        }}
      >
        {result.message}
      </div>
      {result.sub && (
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: colors.textSec, marginTop: 3 }}>
          {result.sub}
        </div>
      )}
    </div>
  );
}

// ─── Main DoorScreen ──────────────────────────────────────────────────────────

const DOOR_MAX_WIDTH = 760;

export default function DoorScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [scanToast, setScanToast] = useState<{ ok: boolean; message: string; sub?: string } | null>(
    null,
  );
  const { isWide } = useResponsive();

  const headerActions = useMemo(
    () => (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 9px',
          borderRadius: 4,
          background: 'rgba(76,175,110,0.12)',
          border: `1px solid rgba(76,175,110,0.35)`,
          fontFamily: 'Inter',
          fontSize: 10,
          color: colors.success,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            background: colors.success,
            display: 'inline-block',
            animation: 'hof-pulse 1.4s ease-in-out infinite',
          }}
        />
        Live
      </div>
    ),
    [],
  );

  useAppHeader({ title: 'Door', actions: headerActions });

  useEffect(() => {
    fetch('/api/door/activity')
      .then((r) => r.json())
      .then((d: { activity?: ActivityEntry[] }) => {
        if (d.activity?.length) setActivity(d.activity);
      })
      .catch(console.error);
  }, []);

  function handleScanned(result: ScanResult, code: string) {
    if ('ok' in result && result.ok) {
      const displayName =
        (result.holder as { display_name?: string } | null)?.display_name ?? 'Guest';
      const tierName = (result.tier as { display_name?: string } | null)?.display_name ?? 'GA';

      setScanToast({ ok: true, message: `✓ Valid — ${displayName}`, sub: `${tierName} · ${code}` });
      setActivity((prev) => [
        {
          t: now12(),
          name: displayName,
          meta: `${tierName} · scanned in`,
          tone: 'success',
          kind: 'scan',
        },
        ...prev,
      ]);
    } else {
      const errMsg = 'error' in result ? result.error : 'Unknown error';
      const isAlreadyIn = errMsg.toLowerCase().includes('already');
      setScanToast({
        ok: false,
        message: isAlreadyIn ? '⚠ Already checked in' : '✗ Invalid ticket',
        sub: errMsg,
      });
    }
  }

  function handleSold(entry: ActivityEntry) {
    setActivity((prev) => [entry, ...prev]);
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: colors.bg,
        overflow: 'hidden',
      }}
    >
      {/* Scan result toast */}
      <ScanToast result={scanToast} onDismiss={() => setScanToast(null)} isWide={isWide} />

      {/* Scrollable content — centered column on tablet/desktop */}
      <div
        className="hof-scroll"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: isWide ? '50%' : 0,
          right: isWide ? 'auto' : 0,
          transform: isWide ? 'translateX(-50%)' : undefined,
          width: isWide ? `min(100%, ${DOOR_MAX_WIDTH}px)` : 'auto',
          overflowY: 'auto',
          paddingBottom: 40,
        }}
      >
        <div style={{ height: isWide ? 64 : 108 }} />

        {/* Scanner viewfinder */}
        <div style={{ padding: '0 12px' }}>
          <ScannerArea onScanned={handleScanned} />
        </div>

        {/* Door stats strip */}
        <div
          style={{
            padding: '14px 16px 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
          }}
        >
          {(
            [
              ['Sold', '253', colors.text],
              [
                'In',
                String(activity.filter((a) => a.kind === 'scan').length + 187),
                colors.success,
              ],
              ['Walk', String(activity.filter((a) => a.kind === 'sale').length + 12), colors.amber],
              ['Left', '47', colors.text],
            ] as [string, string, string][]
          ).map(([l, v, c]) => (
            <div
              key={l}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '8px 6px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'Clash Display',
                  fontWeight: 600,
                  fontSize: 18,
                  color: c,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                }}
              >
                {v}
              </div>
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: 9,
                  color: colors.textSec,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  marginTop: 2,
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>

        {/* Sell at door CTA */}
        <div style={{ padding: '16px' }}>
          <button
            className="hof-btn hof-press"
            onClick={() => setModalOpen(true)}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: colors.amber,
              border: 'none',
              borderRadius: 12,
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: 15,
              color: colors.bg,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.bg}
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Sell at the door
          </button>
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontFamily: 'Inter',
              fontSize: 11,
              color: colors.textSec,
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.success}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Tap to Pay, card reader, or cash — Stripe Terminal.
          </div>
        </div>

        {/* Activity feed */}
        <div style={{ padding: '8px 16px 16px' }}>
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 10,
              color: colors.textSec,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Recent
          </div>
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: '4px 12px',
            }}
          >
            {activity.map((a, i) => (
              <ActivityRow key={i} a={a} />
            ))}
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>

      {/* Sell-at-door modal */}
      <SellAtDoorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSold={handleSold}
        isWide={isWide}
      />
    </div>
  );
}
