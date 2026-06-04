'use client';

import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { WalkUpTicketCard } from '@/components/WalkUpTicketCard';
import { doorSaleReceiptText } from '@/lib/doorReceipt';
import { downloadDataUrl, downloadTextFile } from '@/lib/downloadFile';
import {
  drainDoorSaleQueue,
  enqueueDoorSale,
  generateClientSaleId,
  getQueuedSales,
  postDoorSale,
  type DoorSellResponse,
} from '@/lib/doorSaleQueue';
import { exportTicketCardPng } from '@/lib/exportTicketCard';

export type DoorEventContext = {
  edition_number: number;
  name: string;
  date: string;
  venue_name: string;
  doors_open: string;
  doors_close: string;
};

export interface DoorTierOption {
  id: string;
  name: string;
  display_name: string;
  description?: string | null;
  price_cents: number;
  fee_cents: number;
  status: string;
  sold: number;
  remaining: number;
  purchasable: boolean;
}

function tierSubtitle(t: DoorTierOption): string {
  if (t.description?.trim()) return t.description.trim();
  if (t.status === 'sold_out' || !t.purchasable) return 'Sold out';
  return 'Standard entry';
}

function RadioDot({ selected, disabled }: { selected: boolean; disabled?: boolean }) {
  return (
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        border: selected ? '2px solid var(--hof-amber)' : '2px solid var(--hof-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {selected && (
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            background: 'var(--hof-amber)',
          }}
        />
      )}
    </span>
  );
}

type SoldTicket = { id: string; code: string; qr_data: string; qrUrl?: string };

interface SellModalProps {
  open: boolean;
  onClose: () => void;
  tiers: DoorTierOption[];
  eventContext: DoorEventContext | null;
  onSold: () => void;
  onRefreshStats: () => void;
}

export function SellAtDoorModal({
  open,
  onClose,
  tiers,
  eventContext,
  onSold,
  onRefreshStats,
}: SellModalProps) {
  const [tierId, setTierId] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pay, setPay] = useState<'tap' | 'card' | 'cash'>('cash');
  const [stage, setStage] = useState<'form' | 'complete'>('form');
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [soldTickets, setSoldTickets] = useState<SoldTicket[]>([]);
  const [activeTicketIdx, setActiveTicketIdx] = useState(0);
  const [saleMeta, setSaleMeta] = useState<DoorSellResponse | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const selectedTier = tiers.find((t) => t.id === tierId) ?? tiers.find((t) => t.purchasable) ?? tiers[0];
  const effectiveTierId = tierId || selectedTier?.id || '';
  const subtotalCents = selectedTier?.price_cents ?? 0;
  const feeCents = selectedTier?.fee_cents ?? 0;
  const totalCents = subtotalCents + feeCents;

  const valid =
    first.trim() !== '' &&
    last.trim() !== '' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    !!effectiveTierId &&
    (selectedTier?.purchasable ?? false);

  useEffect(() => {
    if (!open) return;
    const firstPurchasable = tiers.find((t) => t.purchasable);
    if (firstPurchasable && !tiers.some((t) => t.id === tierId)) {
      setTierId(firstPurchasable.id);
    }
  }, [open, tiers, tierId]);

  if (!open) return null;

  async function buildQrUrls(tickets: SoldTicket[]): Promise<SoldTicket[]> {
    return Promise.all(
      tickets.map(async (t) => ({
        ...t,
        qrUrl: await QRCode.toDataURL(t.qr_data, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 200,
          color: { dark: '#1a1a1a', light: '#f5f0e8' },
        }),
      })),
    );
  }

  function resetForm() {
    setStage('form');
    setError('');
    setExportError('');
    setSaleMeta(null);
    setActiveTicketIdx(0);
    setSoldTickets([]);
    setFirst('');
    setLast('');
    setEmail('');
    setPhone('');
    setPay('cash');
    const firstPurchasable = tiers.find((t) => t.purchasable);
    setTierId(firstPurchasable?.id ?? '');
  }

  function handleSuccess(data: DoorSellResponse) {
    setSaleMeta(data);
    onSold();
    onRefreshStats();
    window.dispatchEvent(new CustomEvent('hof:tickets-changed'));
  }

  const activeTicket = soldTickets[activeTicketIdx];
  const payLabel =
    saleMeta?.pay_method === 'tap'
      ? 'Tap'
      : saleMeta?.pay_method === 'card'
        ? 'Card'
        : saleMeta?.pay_method === 'cash'
          ? 'Cash'
          : 'Door';

  function buildReceipt() {
    if (!eventContext || !activeTicket || !saleMeta) return '';
    return doorSaleReceiptText({
      code: activeTicket.code,
      holderName: saleMeta.holder_name ?? `${first.trim()} ${last.trim()}`,
      email: email.trim(),
      phone: phone.trim(),
      tierName: saleMeta.tier_name ?? selectedTier?.display_name ?? 'Ticket',
      payMethod: payLabel,
      subtotalCents: saleMeta.subtotal_cents ?? subtotalCents,
      feeCents: saleMeta.fee_cents ?? feeCents,
      totalCents: saleMeta.total_cents ?? totalCents,
      purchasedAt: saleMeta.purchased_at ?? new Date().toISOString(),
      event: {
        name: eventContext.name,
        edition_number: eventContext.edition_number,
        date: eventContext.date,
        venue_name: eventContext.venue_name,
        doors_open: eventContext.doors_open,
        doors_close: eventContext.doors_close,
      },
    });
  }

  function handleDownloadQr() {
    if (!activeTicket?.qrUrl) return;
    downloadDataUrl(activeTicket.qrUrl, `qr-${activeTicket.code}.png`);
  }

  function handleDownloadReceipt() {
    const text = buildReceipt();
    if (!text) return;
    downloadTextFile(text, `receipt-${activeTicket?.code ?? 'door'}.txt`);
  }

  async function handleSaveTicketImage() {
    setExportError('');
    if (!cardRef.current || !activeTicket) {
      setExportError('Ticket card not ready');
      return;
    }
    const result = await exportTicketCardPng(cardRef.current, `ticket-${activeTicket.code}.png`);
    if (!result.ok) {
      setExportError(result.error);
    }
  }

  async function submit() {
    if (!valid || !effectiveTierId) return;
    setError('');
    setSubmitting(true);
    const clientSaleId = generateClientSaleId();
    const payload = {
      client_sale_id: clientSaleId,
      tier_id: effectiveTierId,
      first_name: first.trim(),
      last_name: last.trim(),
      email: email.trim(),
      phone: phone.trim(),
      qty: 1,
      pay_method: pay,
      queued_at: new Date().toISOString(),
    };

    const result = await postDoorSale(payload);

    if (!result.ok) {
      if (result.retryable) {
        enqueueDoorSale(payload);
        setError('Offline — sale queued. Will sync when connection returns.');
        setSubmitting(false);
        return;
      }
      setError(result.error);
      setSubmitting(false);
      return;
    }

    const tickets = result.data.tickets ?? [];
    const withQr = await buildQrUrls(tickets);
    setSoldTickets(withQr);
    setActiveTicketIdx(0);
    handleSuccess(result.data);
    setStage('complete');
    setSubmitting(false);
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
    height: 48,
    padding: '0 14px',
    background: '#161616',
    border: '1px solid #2e2e2e',
    borderRadius: 10,
    fontFamily: 'Inter, system-ui',
    fontSize: 16,
    color: '#f5f0e8',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui',
    fontSize: 10,
    color: '#9a9590',
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
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="hof-sell-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: stage === 'complete' ? 'min(480px, 100%)' : 'min(560px, calc(100% - 24px))',
          maxHeight: 'min(92vh, 880px)',
          overflowY: 'auto',
          background: '#0c0c0c',
          border: '1px solid #2e2e2e',
          borderRadius: 16,
          color: '#f5f0e8',
          fontFamily: 'Inter, system-ui',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
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
                color: '#9a9590',
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
                color: '#f5f0e8',
                marginTop: 4,
              }}
            >
              Sell at the door
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: '#161616',
              border: '1px solid #2e2e2e',
              cursor: 'pointer',
              color: '#f5f0e8',
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {stage === 'complete' && eventContext && activeTicket && (
          <div style={{ padding: 22 }}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div
                style={{
                  fontFamily: 'Clash Display, system-ui',
                  fontWeight: 600,
                  fontSize: 20,
                  color: '#f5f0e8',
                }}
              >
                Sale complete
              </div>
              <div style={{ fontSize: 13, color: '#9a9590', marginTop: 6 }}>
                {saleMeta?.holder_name} · {saleMeta?.tier_name}
              </div>
            </div>

            {soldTickets.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 12,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {soldTickets.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTicketIdx(i)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border:
                        activeTicketIdx === i
                          ? '2px solid var(--hof-amber)'
                          : '1px solid #2e2e2e',
                      background: activeTicketIdx === i ? 'rgba(232,101,26,0.12)' : '#161616',
                      color: '#f5f0e8',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    {t.code}
                  </button>
                ))}
              </div>
            )}

            <WalkUpTicketCard
              ref={cardRef}
              editionNumber={eventContext.edition_number}
              eventName={eventContext.name}
              tierLabel={saleMeta?.tier_name ?? 'Ticket'}
              holderName={saleMeta?.holder_name ?? ''}
              eventDate={eventContext.date}
              venueName={eventContext.venue_name}
              doorsOpen={eventContext.doors_open}
              doorsClose={eventContext.doors_close}
              code={activeTicket.code}
              qrUrl={activeTicket.qrUrl ?? ''}
              ticketIndex={activeTicketIdx + 1}
              ticketTotal={soldTickets.length}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                marginTop: 16,
              }}
            >
              {(
                [
                  ['QR code', handleDownloadQr],
                  ['Receipt', handleDownloadReceipt],
                  ['Ticket image', () => void handleSaveTicketImage()],
                ] as const
              ).map(([label, onClick]) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  style={{
                    height: 44,
                    borderRadius: 8,
                    border: '1px solid #2e2e2e',
                    background: '#161616',
                    color: '#f5f0e8',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {exportError && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--hof-amber)' }}>
                {exportError}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              style={{
                width: '100%',
                height: 52,
                marginTop: 16,
                background: 'var(--hof-amber)',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer',
                color: '#0c0c0c',
                fontFamily: 'Inter, system-ui',
                fontSize: 15,
              }}
            >
              Done — next guest
            </button>
          </div>
        )}

        <style>{`.hof-sell-modal input::placeholder { color: #6b6560; opacity: 1; }`}</style>

        {stage === 'form' && (
          <div style={{ padding: 22, paddingBottom: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tiers.map((t) => {
                const disabled = !t.purchasable;
                const selected = effectiveTierId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setTierId(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 16px',
                      textAlign: 'left',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.45 : 1,
                      background: '#161616',
                      border: selected
                        ? '1px solid var(--hof-amber)'
                        : '1px solid #2e2e2e',
                      borderRadius: 12,
                      width: '100%',
                    }}
                  >
                    <RadioDot selected={selected} disabled={disabled} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: '#f5f0e8',
                        }}
                      >
                        {t.display_name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#9a9590',
                          marginTop: 2,
                        }}
                      >
                        {tierSubtitle(t)}
                        {!disabled && ` · ${t.remaining} left`}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: 'Clash Display, system-ui',
                        fontWeight: 600,
                        fontSize: 18,
                        color: '#f5f0e8',
                        flexShrink: 0,
                      }}
                    >
                      ${((t.price_cents + (t.fee_cents ?? 0)) / 100).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
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
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@example.com"
                style={inputStyle}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(555) 123-4567"
                style={inputStyle}
              />
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={labelStyle}>Payment (record only)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(
                  [
                    ['cash', 'Cash'],
                    ['card', 'Card'],
                    ['tap', 'Tap'],
                  ] as const
                ).map(([id, title]) => {
                  const selected = pay === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPay(id)}
                      style={{
                        height: 48,
                        background: selected ? 'rgba(232,101,26,0.12)' : '#161616',
                        border: selected
                          ? '2px solid var(--hof-amber)'
                          : '1px solid #2e2e2e',
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: 14,
                        color: '#f5f0e8',
                        cursor: 'pointer',
                        fontFamily: 'Inter, system-ui',
                      }}
                    >
                      {title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                padding: '14px 16px',
                background: '#161616',
                border: '1px solid #2e2e2e',
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: '#9a9590',
                  marginBottom: feeCents > 0 ? 8 : 0,
                }}
              >
                <span>Ticket</span>
                <span style={{ color: '#f5f0e8' }}>${(subtotalCents / 100).toFixed(2)}</span>
              </div>
              {feeCents > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: '#9a9590',
                    marginBottom: 10,
                  }}
                >
                  <span>Service fee</span>
                  <span style={{ color: '#f5f0e8' }}>${(feeCents / 100).toFixed(2)}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingTop: feeCents > 0 ? 10 : 0,
                  borderTop: feeCents > 0 ? '1px solid #2e2e2e' : 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: '#9a9590',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontFamily: 'Clash Display, system-ui',
                    fontWeight: 600,
                    fontSize: 28,
                    color: '#f5f0e8',
                  }}
                >
                  ${(totalCents / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  background: 'rgba(232,101,26,0.12)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--hof-amber)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={!valid || submitting}
              onClick={() => void submit()}
              style={{
                width: '100%',
                height: 52,
                marginTop: 16,
                background: valid && !submitting ? 'var(--hof-amber)' : '#1f1f1f',
                border: valid && !submitting ? 'none' : '1px solid #3a3a3a',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 15,
                cursor: valid && !submitting ? 'pointer' : 'not-allowed',
                color: valid && !submitting ? '#0c0c0c' : '#c4beb6',
                fontFamily: 'Inter, system-ui',
              }}
            >
              {submitting
                ? 'Saving…'
                : valid
                  ? `Complete sale · $${(totalCents / 100).toFixed(2)}`
                  : 'Fill in details'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function DoorQueueBanner({
  onSynced,
}: {
  onSynced: () => void;
}) {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  function refresh() {
    setPending(getQueuedSales().length);
  }

  useEffect(() => {
    refresh();
    const onOnline = () => void drainDoorSaleQueue().then(() => {
      refresh();
      onSynced();
    });
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [onSynced]);

  if (pending === 0) return null;

  return (
    <div
      style={{
        margin: '0 28px 12px',
        padding: '10px 14px',
        background: 'rgba(232,101,26,0.12)',
        border: '1px solid var(--hof-amber)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 13,
      }}
    >
      <span>
        {pending} walk-up sale{pending === 1 ? '' : 's'} pending sync
      </span>
      <button
        type="button"
        disabled={syncing}
        onClick={() => {
          setSyncing(true);
          void drainDoorSaleQueue().then(() => {
            refresh();
            onSynced();
            setSyncing(false);
          });
        }}
        style={{
          padding: '6px 12px',
          background: 'var(--hof-amber)',
          border: 'none',
          borderRadius: 6,
          fontWeight: 600,
          cursor: 'pointer',
          color: 'var(--hof-bg)',
        }}
      >
        {syncing ? 'Syncing…' : 'Retry now'}
      </button>
    </div>
  );
}
