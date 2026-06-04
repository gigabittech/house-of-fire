'use client';

import { colors } from '@hof/design-tokens';
import type { ToastKind } from '@hof/ui';
import { EmptyState, FakeQR, HofSkeleton, HofToast, Icon, useResponsive } from '@hof/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import { useCallback, useEffect, useState } from 'react';
import { formatDoorsRange, normalizeEventTime } from '@/lib/eventDisplay';
import RefundSheet from '../sheets/RefundSheet';
import { ShareSheet } from '../sheets/ShareSheet';
import TransferSheet from '../sheets/TransferSheet';
import { UpgradeSheet } from '../sheets/UpgradeSheet';

type TicketHolderProfile = { display_name: string; handle?: string } | null;

type TicketData = {
  id: string;
  code: string;
  qr_data: string;
  status: string;
  purchased_at: string;
  amount_cents: number;
  fee_cents: number;
  order_id?: string | null;
  metadata?: { holder_name?: string | null; holder_email?: string | null } | null;
  events: {
    name: string;
    date: string;
    edition_number: number;
    venue_name: string;
    venue_address: string;
    doors_open?: string;
    doors_close?: string;
  } | null;
  ticket_tiers: { display_name: string } | null;
  profiles?: TicketHolderProfile | TicketHolderProfile[];
};

function resolveHolderProfile(
  profiles: TicketData['profiles'],
): TicketHolderProfile {
  if (!profiles) return null;
  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

function ticketEvent(ticket: TicketData | null): TicketData['events'] {
  if (!ticket?.events) return null;
  const e = ticket.events;
  return Array.isArray(e) ? (e[0] ?? null) : e;
}

function parseDoorTimeFromDb(raw: string): string | null {
  const trimmed = raw.trim();
  const timeMatch = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed);
  if (timeMatch) return normalizeEventTime(trimmed);
  const parsed = Date.parse(trimmed);
  if (Number.isFinite(parsed)) {
    const d = new Date(parsed);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return null;
}

function ticketHolderName(ticket: TicketData | null, fallback?: string | null): string {
  if (!ticket) return fallback?.trim() || '—';
  const profile = resolveHolderProfile(ticket.profiles);
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  const meta = ticket.metadata;
  if (meta && typeof meta.holder_name === 'string' && meta.holder_name.trim()) {
    return meta.holder_name.trim();
  }
  if (fallback?.trim()) return fallback.trim();
  return '—';
}

function ticketDoorsLabel(ticket: TicketData | null): string {
  const ev = ticketEvent(ticket);
  if (!ev?.doors_open) return '—';
  const open = parseDoorTimeFromDb(ev.doors_open);
  if (!open) return '—';
  const close = ev.doors_close ? parseDoorTimeFromDb(ev.doors_close) : null;
  return formatDoorsRange(open, close ?? undefined);
}

async function loadAllTickets(options: {
  paymentIntentId?: string | null;
}): Promise<TicketData[]> {
  if (options.paymentIntentId) {
    try {
      const r = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: options.paymentIntentId }),
      });
      if (r.ok) {
        const d = (await r.json()) as { tickets?: TicketData[] };
        const fulfilled = (d.tickets ?? []).filter((t) => t.status === 'valid');
        if (fulfilled.length > 0) return fulfilled;
      }
    } catch {
      /* poll mine below */
    }
  }

  const r = await fetch('/api/tickets/mine');
  if (!r.ok) throw new Error('fetch failed');
  const d = (await r.json()) as { tickets?: TicketData[] };
  return (d.tickets ?? []).filter((t) => t.status === 'valid');
}

async function qrDataUrlForTicket(t: TicketData): Promise<string> {
  return QRCode.toDataURL(t.qr_data, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
    color: { dark: '#1a1a1a', light: '#f5f0e8' },
  });
}

function orderReceiptTotals(tickets: TicketData[], orderId: string | null | undefined) {
  const first = tickets[0];
  const group = orderId
    ? tickets.filter((t) => t.order_id === orderId)
    : first
      ? [first]
      : [];
  const subtotal = group.reduce((s, t) => s + t.amount_cents, 0);
  const fees = group.reduce((s, t) => s + t.fee_cents, 0);
  return { subtotal, fees, total: subtotal + fees, count: group.length };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatPurchasedAt(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export default function TicketScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchased = searchParams.get('purchased') === '1';
  const paymentIntentFromRedirect = searchParams.get('payment_intent');
  const [transferOpen, setTransferOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [toast, setToast] = useState<{ shown: boolean; kind: ToastKind; message: string }>({
    shown: false,
    kind: 'success',
    message: '',
  });
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [qrByTicketId, setQrByTicketId] = useState<Record<string, string>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketError, setTicketError] = useState(false);
  const [holderFallback, setHolderFallback] = useState<string | null>(null);
  const { isWide } = useResponsive();

  const ticket = tickets[activeIndex] ?? null;
  const ev = ticketEvent(ticket);
  const holderLabel = ticketHolderName(ticket, holderFallback);
  const doorsLabel = ticketDoorsLabel(ticket);
  const qrDataUrl = ticket ? (qrByTicketId[ticket.id] ?? '') : '';
  const receipt = orderReceiptTotals(tickets, ticket?.order_id);

  const reloadTickets = useCallback(async () => {
    const list = await loadAllTickets({ paymentIntentId: paymentIntentFromRedirect });
    setTickets(list);
    setActiveIndex((i) => Math.min(i, Math.max(0, list.length - 1)));
    return list;
  }, [paymentIntentFromRedirect]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setTicketError(false);

      const shouldPoll = purchased || Boolean(paymentIntentFromRedirect);
      const attempts = shouldPoll ? 5 : 1;
      const delayMs = shouldPoll ? 1000 : 0;

      try {
        for (let i = 0; i < attempts; i++) {
          if (cancelled) return;
          const list = await loadAllTickets({
            paymentIntentId: paymentIntentFromRedirect,
          });
          if (list.length > 0) {
            if (!cancelled) {
              setTickets(list);
              setActiveIndex(0);
            }
            return;
          }
          if (i < attempts - 1) await sleep(delayMs);
        }
      } catch {
        if (!cancelled) setTicketError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [purchased, paymentIntentFromRedirect]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { profile?: { display_name?: string } } | null) => {
        if (cancelled || !d?.profile?.display_name?.trim()) return;
        setHolderFallback(d.profile.display_name.trim());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = tickets[activeIndex];
    if (!t || qrByTicketId[t.id]) return;

    let cancelled = false;
    void qrDataUrlForTicket(t)
      .then((url) => {
        if (!cancelled) {
          setQrByTicketId((prev) => ({ ...prev, [t.id]: url }));
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [tickets, activeIndex, qrByTicketId]);

  function goToTicket(index: number) {
    if (tickets.length === 0) return;
    const next = ((index % tickets.length) + tickets.length) % tickets.length;
    setActiveIndex(next);
  }

  function handleTouchStart(clientX: number) {
    setTouchStartX(clientX);
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX === null || tickets.length < 2) return;
    const delta = clientX - touchStartX;
    if (delta > 48) goToTicket(activeIndex - 1);
    else if (delta < -48) goToTicket(activeIndex + 1);
    setTouchStartX(null);
  }

  function showToast(kind: ToastKind, message: string) {
    setToast({ shown: true, kind, message });
    setTimeout(() => setToast((t) => ({ ...t, shown: false })), 3500);
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
      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: isWide ? 0 : 54,
          left: isWide ? '50%' : 0,
          right: isWide ? 'auto' : 0,
          transform: isWide ? 'translateX(-50%)' : undefined,
          width: isWide ? 'min(100%, 620px)' : 'auto',
          boxSizing: 'border-box',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(10,10,8,0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          className="hof-btn hof-press"
          onClick={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chev" size={18} color={colors.text} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <span
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 16,
            color: colors.text,
          }}
        >
          Your Ticket
        </span>
        <button
          className="hof-btn hof-press"
          onClick={() => setShareOpen(true)}
          aria-label="Share ticket"
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="share" size={20} color={colors.text} />
        </button>
      </div>

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
          width: isWide ? 'min(100%, 620px)' : 'auto',
          overflowY: 'auto',
          paddingBottom: 40,
        }}
      >
        <div style={{ height: isWide ? 64 : 102 }} />

        {loading ? (
          <div style={{ padding: '0 16px' }}>
            <HofSkeleton width="100%" height={300} radius={16} />
          </div>
        ) : ticketError ? (
          <div style={{ padding: '0 16px' }}>
            <EmptyState title="Could not load ticket" body="Check your connection and try again." />
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '0 16px' }}>
            <EmptyState
              title="No ticket"
              body="Get your ticket to Edition X."
              action={
                <button
                  className="hof-btn hof-press"
                  onClick={() => router.push('/checkout')}
                  style={{
                    padding: '10px 24px',
                    background: colors.amber,
                    border: `1px solid ${colors.amber}`,
                    borderRadius: 8,
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: 14,
                    color: colors.bg,
                  }}
                >
                  Get tickets
                </button>
              }
            />
          </div>
        ) : null}

        {!loading && !ticketError && ticket !== null && tickets.length > 0 && (
          <>
            {/* Day-of contextual banner */}
            <div
              style={{
                margin: '0 16px 16px',
                padding: '12px 14px',
                background: 'rgba(232,101,26,0.1)',
                border: `1px solid rgba(232,101,26,0.3)`,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: colors.amber,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="flame" size={14} color={colors.bg} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: 13,
                    color: colors.text,
                  }}
                >
                  Tonight&apos;s the night.
                </div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 11,
                    color: colors.textSec,
                    marginTop: 1,
                  }}
                >
                  {ticket?.events?.doors_open
                    ? `Doors ${formatDoorsRange(ticket.events.doors_open, ticket.events.doors_close)}. Side entrance on 23rd.`
                    : 'Doors open soon. Side entrance on 23rd.'}
                </div>
              </div>
            </div>

            {/* Success copy */}
            <div style={{ padding: '12px 16px 18px' }}>
              <div
                style={{
                  fontFamily: 'Clash Display',
                  fontWeight: 700,
                  fontSize: 40,
                  color: colors.text,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                You&apos;re in.
              </div>
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: 14,
                  color: colors.textSec,
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                See you Friday. The QR below is your ticket — open this screen at the door.
              </div>
            </div>

            {/* Ticket card — swipe between tickets when qty > 1 */}
            <div style={{ padding: '0 16px' }}>
              <div
                onTouchStart={(e) => handleTouchStart(e.changedTouches[0]?.clientX ?? 0)}
                onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
                style={{
                  background: colors.text,
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 12px 40px rgba(232,101,26,0.15), 0 0 0 1px rgba(240,237,230,0.1)',
                  position: 'relative',
                  touchAction: 'pan-y',
                }}
              >
                {/* Top stub */}
                <div
                  style={{
                    padding: '20px 20px 16px',
                    position: 'relative',
                    background: colors.text,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'Inter',
                          fontSize: 10,
                          color: colors.bg,
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          opacity: 0.5,
                        }}
                      >
                        Edition {ticket?.events?.edition_number ?? '—'} · Admit one
                        {tickets.length > 1
                          ? ` · ${activeIndex + 1} of ${tickets.length}`
                          : ''}
                      </div>
                      <img
                        src="/assets/hof-logo-black.png"
                        alt="House of Fire"
                        style={{
                          height: 30,
                          width: 'auto',
                          display: 'block',
                          marginTop: 8,
                          marginLeft: -3,
                        }}
                      />
                      <div
                        style={{
                          fontFamily: 'Clash Display',
                          fontWeight: 600,
                          fontSize: 16,
                          color: colors.bg,
                          marginTop: 6,
                          lineHeight: 1,
                          letterSpacing: '0',
                          textTransform: 'uppercase',
                        }}
                      >
                        {ticket?.events?.name ?? 'Edition 24 — Fireversary'}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          padding: '4px 8px',
                          background: colors.amber,
                          color: colors.bg,
                          fontFamily: 'Inter',
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          borderRadius: 4,
                        }}
                      >
                        {ticket?.ticket_tiers?.display_name ?? 'GA'}
                      </div>
                      <button
                        className="hof-btn hof-press"
                        onClick={() => setUpgradeOpen(true)}
                        style={{
                          padding: '3px 8px',
                          background: 'rgba(201,148,42,0.15)',
                          border: `1px solid ${colors.gold}`,
                          borderRadius: 4,
                          fontFamily: 'Inter',
                          fontSize: 9,
                          fontWeight: 600,
                          color: colors.gold,
                          letterSpacing: '0.10em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Upgrade
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 14,
                      marginTop: 18,
                    }}
                  >
                    {(
                      [
                        [
                          'Date',
                          ev?.date
                            ? new Date(ev.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—',
                        ],
                        ['Doors', doorsLabel],
                        ['Venue', ev?.venue_name ?? '—'],
                        ['Holder', holderLabel],
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <div key={k}>
                        <div
                          style={{
                            fontFamily: 'Inter',
                            fontSize: 9,
                            color: colors.bg,
                            opacity: 0.5,
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {k}
                        </div>
                        <div
                          style={{
                            fontFamily: 'Inter',
                            fontWeight: 500,
                            fontSize: 13,
                            color: colors.bg,
                            marginTop: 2,
                          }}
                        >
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Perforation */}
                <div style={{ position: 'relative', height: 18 }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: -10,
                      top: '50%',
                      width: 20,
                      height: 20,
                      background: colors.bg,
                      borderRadius: 10,
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: -10,
                      top: '50%',
                      width: 20,
                      height: 20,
                      background: colors.bg,
                      borderRadius: 10,
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 16,
                      right: 16,
                      top: '50%',
                      borderTop: `1.5px dashed rgba(10,10,8,0.2)`,
                    }}
                  />
                </div>

                {/* QR area */}
                <div
                  style={{
                    padding: '6px 20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Ticket QR"
                      style={{ width: 230, height: 230, objectFit: 'contain' }}
                    />
                  ) : (
                    <FakeQR size={230} fg={colors.bg} bg={colors.text} />
                  )}
                  <div
                    style={{
                      marginTop: 14,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 13,
                      color: colors.bg,
                      letterSpacing: '0.16em',
                      fontWeight: 500,
                    }}
                  >
                    {ticket?.code ?? 'HOF-24-????'}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontFamily: 'Inter',
                      fontSize: 11,
                      color: colors.bg,
                      opacity: 0.5,
                    }}
                  >
                    Show at the door · keep brightness up
                  </div>
                </div>
              </div>

              {tickets.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    marginTop: 14,
                  }}
                >
                  <button
                    type="button"
                    className="hof-btn hof-press"
                    aria-label="Previous ticket"
                    onClick={() => goToTicket(activeIndex - 1)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="chev" size={16} color={colors.text} />
                  </button>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {tickets.map((t, i) => (
                      <button
                        key={t.id}
                        type="button"
                        aria-label={`Ticket ${i + 1}`}
                        onClick={() => setActiveIndex(i)}
                        style={{
                          width: i === activeIndex ? 18 : 6,
                          height: 6,
                          borderRadius: 3,
                          border: 'none',
                          padding: 0,
                          background: i === activeIndex ? colors.amber : colors.border,
                          transition: 'width 150ms ease-out',
                        }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="hof-btn hof-press"
                    aria-label="Next ticket"
                    onClick={() => goToTicket(activeIndex + 1)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      name="chev"
                      size={16}
                      color={colors.text}
                      style={{ transform: 'rotate(180deg)' }}
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div
              style={{
                padding: '20px 16px 0',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {[
                {
                  label: 'Add to Wallet',
                  icon: 'wallet' as const,
                  onClick: () => {
                    if (!qrDataUrl) return;
                    const a = document.createElement('a');
                    a.href = qrDataUrl;
                    a.download = `${ticket?.code ?? 'ticket'}.png`;
                    a.click();
                  },
                },
                { label: 'Save PDF', icon: 'download' as const, onClick: () => window.print() },
                { label: 'Transfer', icon: 'share' as const, onClick: () => setTransferOpen(true) },
                {
                  label: 'Request refund',
                  icon: 'bolt' as const,
                  onClick: () => setRefundOpen(true),
                },
              ].map(({ label, icon, onClick }) => (
                <button
                  key={label}
                  className="hof-btn hof-press"
                  onClick={onClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 14px',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: 13,
                    color: colors.text,
                  }}
                >
                  <Icon name={icon} size={16} color={colors.text} />
                  {label}
                </button>
              ))}
            </div>

            {/* Tell a friend */}
            <div style={{ padding: '24px 16px 0' }}>
              <button
                className="hof-btn hof-press"
                onClick={() => setShareOpen(true)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <Icon name="flame" size={16} color={colors.amber} />
                  <div
                    style={{
                      fontFamily: 'Clash Display',
                      fontWeight: 600,
                      fontSize: 16,
                      color: colors.text,
                    }}
                  >
                    Tell a friend
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: colors.textSec,
                    marginBottom: 12,
                  }}
                >
                  35 tickets left at General. The room fills up by the weekend.
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: 12,
                      color: colors.textSec,
                    }}
                  >
                    houseoffire.events/e/24
                  </span>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: colors.amber,
                      fontWeight: 500,
                    }}
                  >
                    Copy
                  </span>
                </div>
              </button>
            </div>

            {/* Receipt */}
            <div style={{ padding: '24px 16px 0' }}>
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: 10,
                  color: colors.textSec,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                Receipt
              </div>
              <div
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: 14,
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {(
                  [
                    [
                      'Order',
                      receipt.count > 1
                        ? `${receipt.count} tickets`
                        : (ticket?.code ?? '—'),
                    ],
                    ['Date', ticket ? formatPurchasedAt(ticket.purchased_at) : '—'],
                    ['Payment', 'Paid via Stripe'],
                    ['Subtotal', formatCents(receipt.subtotal)],
                    ['Fees', formatCents(receipt.fees)],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      color: colors.textSec,
                    }}
                  >
                    <span>{k}</span>
                    <span style={{ color: colors.text }}>{v}</span>
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0 0',
                    marginTop: 4,
                    borderTop: `1px solid ${colors.border}`,
                    fontWeight: 500,
                    color: colors.text,
                  }}
                >
                  <span>Total</span>
                  <span>{formatCents(receipt.total)}</span>
                </div>
              </div>
            </div>

            <div style={{ height: 40 }} />
          </>
        )}
      </div>

      {/* Toast */}
      {toast.shown && (
        <div
          style={{
            position: 'absolute',
            top: 100,
            left: isWide ? '50%' : 16,
            right: isWide ? 'auto' : 16,
            transform: isWide ? 'translateX(-50%)' : undefined,
            width: isWide ? 'min(100% - 32px, 588px)' : 'auto',
            zIndex: 50,
          }}
        >
          <HofToast kind={toast.kind} onDismiss={() => setToast((t) => ({ ...t, shown: false }))}>
            {toast.message}
          </HofToast>
        </div>
      )}

      <TransferSheet
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        ticketId={ticket?.id}
        ticketSummary={
          ticket
            ? `${ticket.events?.name ?? 'House of Fire'} · ${ticket.ticket_tiers?.display_name ?? 'Ticket'} · Ed ${ticket.events?.edition_number ?? '—'} · ${formatCents(ticket.amount_cents)}`
            : undefined
        }
        onTransferred={() => {
          showToast('success', 'Ticket transferred — they have 24h to accept.');
          void reloadTickets();
        }}
      />
      <RefundSheet
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        ticketId={ticket?.id}
      />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
      <UpgradeSheet open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
