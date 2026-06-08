'use client';

import { colors } from '@hof/design-tokens';
import type { ToastKind } from '@hof/ui';
import { EmptyState, FakeQR, HofToast, Icon } from '@hof/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppHeaderIconButton } from '@/components/AppHeaderIconButton';
import { useAppHeader } from '@/hooks/useAppHeader';
import { formatDoorsRange, normalizeEventTime } from '@/lib/eventDisplay';
import { QR_RENDER_OPTIONS } from '@/lib/qrRenderOptions';
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

function resolveHolderProfile(profiles: TicketData['profiles']): TicketHolderProfile {
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

async function loadAllTickets(options: { paymentIntentId?: string | null }): Promise<TicketData[]> {
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
  return QRCode.toDataURL(t.qr_data, QR_RENDER_OPTIONS);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const ticketFieldLabelStyle = {
  fontFamily: 'Inter',
  fontSize: 9,
  color: colors.bg,
  opacity: 0.5,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
};

const ticketFieldValueStyle = {
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: 13,
  color: colors.bg,
  marginTop: 2,
};

/** Shimmer bar tuned for the light ticket card (not dark-page HofSkeleton). */
function TicketSkeletonBar({
  width,
  height = 13,
  radius = 4,
  style,
}: {
  width: number | string;
  height?: number;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        borderRadius: radius,
        background:
          'linear-gradient(90deg, rgba(10,10,8,0.06) 0%, rgba(10,10,8,0.14) 50%, rgba(10,10,8,0.06) 100%)',
        backgroundSize: '200% 100%',
        animation: 'hof-shimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

function TicketDetailField({
  label,
  loading,
  value,
}: {
  label: string;
  loading: boolean;
  value: string;
}) {
  return (
    <div>
      <div style={ticketFieldLabelStyle}>{label}</div>
      {loading ? (
        <TicketSkeletonBar width="100%" height={13} style={{ marginTop: 2, maxWidth: 140 }} />
      ) : (
        <div style={ticketFieldValueStyle}>{value}</div>
      )}
    </div>
  );
}

export default function TicketScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchasedFromUrl = searchParams.get('purchased') === '1';
  const paymentIntentFromRedirect = searchParams.get('payment_intent');
  const [justPurchased, setJustPurchased] = useState(false);
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
  const [buyerEmail, setBuyerEmail] = useState<string | null>(null);

  const headerActions = useMemo(
    () => (
      <AppHeaderIconButton
        icon="share"
        label="Share ticket"
        onClick={() => setShareOpen(true)}
      />
    ),
    [],
  );

  const handleBack = useCallback(() => router.back(), [router]);

  useAppHeader({ title: 'Ticket', actions: headerActions, onBack: handleBack });

  useEffect(() => {
    if (purchasedFromUrl) setJustPurchased(true);
  }, [purchasedFromUrl]);

  const ticket = tickets[activeIndex] ?? null;
  const ev = ticketEvent(ticket);
  const holderLabel = ticketHolderName(ticket, holderFallback);
  const doorsLabel = ticketDoorsLabel(ticket);
  const qrDataUrl = ticket ? (qrByTicketId[ticket.id] ?? '') : '';
  const receiptEmail =
    buyerEmail?.trim() ||
    ticket?.metadata?.holder_email?.trim() ||
    tickets[0]?.metadata?.holder_email?.trim() ||
    null;

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

      const shouldPoll = purchasedFromUrl || Boolean(paymentIntentFromRedirect);
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
  }, [purchasedFromUrl, paymentIntentFromRedirect]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { profile?: { display_name?: string; email?: string | null } } | null) => {
        if (cancelled || !d?.profile) return;
        if (d.profile.display_name?.trim()) {
          setHolderFallback(d.profile.display_name.trim());
        }
        if (d.profile.email?.trim()) {
          setBuyerEmail(d.profile.email.trim());
        }
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

  useEffect(() => {
    if (!purchasedFromUrl || loading || tickets.length === 0) return;
    router.replace('/ticket', { scroll: false });
  }, [purchasedFromUrl, loading, tickets.length, router]);

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

  function handleSavePdf() {
    window.print();
  }

  const hasTickets = !loading && !ticketError && tickets.length > 0;
  const showTicketExperience = loading || hasTickets;
  const showEmptyOrError = !loading && (ticketError || tickets.length === 0);
  const ticketFieldsLoading = loading || ticket === null;

  return (
    <div
      className="hof-ticket-page"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: colors.bg,
        overflow: 'hidden',
      }}
    >
      {/* Scrollable content — centered column on tablet/desktop */}
      <div
        className="hof-scroll hof-ticket-scroll"
        style={{
          overflowY: 'auto',
          paddingBottom: 40,
        }}
      >
        <div className="hof-no-print hof-ticket-scroll-top" aria-hidden />

        {showEmptyOrError ? (
          <div className="hof-no-print" style={{ padding: '0 16px' }}>
            {ticketError ? (
              <EmptyState title="Could not load ticket" body="Check your connection and try again." />
            ) : (
              <EmptyState
                title="No ticket"
                body="Get your ticket to Theme X."
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
            )}
          </div>
        ) : null}

        {showTicketExperience ? (
          <>
            {!justPurchased ? (
              <div
                className="hof-no-print"
                style={{
                  margin: '54px 16px 16px',
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
                    {ticketFieldsLoading
                      ? 'Doors open soon. Side entrance on 23rd.'
                      : ev?.doors_open
                        ? `Doors ${formatDoorsRange(ev.doors_open, ev.doors_close)}. Side entrance on 23rd.`
                        : 'Doors open soon. Side entrance on 23rd.'}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="hof-no-print" style={{ padding: '12px 16px 18px' }}>
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
                See you at the door. The QR below is your ticket — keep brightness up when you arrive.
              </div>
              {justPurchased ? (
                <div
                  style={{
                    marginTop: 14,
                    padding: '12px 14px',
                    background: 'rgba(76,175,110,0.1)',
                    border: '1px solid rgba(76,175,110,0.28)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      background: colors.success,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="check" size={14} color={colors.bg} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'Inter',
                        fontWeight: 600,
                        fontSize: 13,
                        color: colors.text,
                      }}
                    >
                      Email sent
                    </div>
                    <div
                      style={{
                        fontFamily: 'Inter',
                        fontSize: 12,
                        color: colors.textSec,
                        marginTop: 4,
                        lineHeight: 1.55,
                      }}
                    >
                      {receiptEmail ? (
                        <>
                          Your receipt and ticket{ tickets.length > 1 ? 's' : ''} were sent to your email.
                          Check your inbox — and spam if you don&apos;t see it within a few minutes.
                        </>
                      ) : (
                        <>
                          Your receipt and ticket{ tickets.length > 1 ? 's' : ''} were sent to the email
                          you used at checkout. Check your inbox — and spam if needed.
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Ticket card */}
            <div id="hof-ticket-print" style={{ padding: '0 16px' }}>
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
                      {ticketFieldsLoading ? (
                        <TicketSkeletonBar width={168} height={10} />
                      ) : (
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
                          Theme {ticket?.events?.edition_number ?? '—'} · Admit one
                          {tickets.length > 1 ? ` · ${activeIndex + 1} of ${tickets.length}` : ''}
                        </div>
                      )}
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
                      {ticketFieldsLoading ? (
                        <TicketSkeletonBar width="100%" height={16} style={{ marginTop: 6, maxWidth: 200 }} />
                      ) : (
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
                          {ticket?.events?.name ?? 'Theme 24 — Fireversary'}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 6,
                      }}
                    >
                      {ticketFieldsLoading ? (
                        <TicketSkeletonBar width={52} height={22} radius={4} />
                      ) : (
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
                      )}
                      <button
                        type="button"
                        className="hof-btn hof-press hof-no-print"
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
                    <TicketDetailField
                      label="Date"
                      loading={ticketFieldsLoading}
                      value={
                        ev?.date
                          ? new Date(ev.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'
                      }
                    />
                    <TicketDetailField
                      label="Doors"
                      loading={ticketFieldsLoading}
                      value={doorsLabel}
                    />
                    <TicketDetailField
                      label="Venue"
                      loading={ticketFieldsLoading}
                      value={ev?.venue_name ?? '—'}
                    />
                    <TicketDetailField
                      label="Holder"
                      loading={ticketFieldsLoading}
                      value={holderLabel}
                    />
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
                  {ticketFieldsLoading || !qrDataUrl ? (
                    <FakeQR size={230} fg={colors.bg} bg={colors.text} />
                  ) : (
                    <img
                      src={qrDataUrl}
                      alt="Ticket QR"
                      style={{ width: 230, height: 230, objectFit: 'contain' }}
                    />
                  )}
                  {ticketFieldsLoading ? (
                    <TicketSkeletonBar width={128} height={13} style={{ marginTop: 14 }} />
                  ) : (
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
                  )}
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

              {!ticketFieldsLoading && tickets.length > 1 && (
                <div
                  className="hof-no-print"
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

            <div
              className="hof-no-print"
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
                { label: 'Save PDF', icon: 'download' as const, onClick: handleSavePdf },
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

            <div className="hof-no-print" style={{ padding: '24px 16px 0' }}>
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

            <div className="hof-no-print" style={{ height: 40 }} />
          </>
        ) : null}
      </div>

      {/* Toast */}
      {toast.shown && (
        <div className="hof-no-print hof-ticket-toast">
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
            ? `${ticket.events?.name ?? 'House of Fire'} · ${ticket.ticket_tiers?.display_name ?? 'Ticket'} · Th ${ticket.events?.edition_number ?? '—'} · ${formatCents(ticket.amount_cents)}`
            : undefined
        }
        onTransferred={() => {
          showToast('success', 'Ticket transferred — they have 24h to accept.');
          void reloadTickets();
        }}
      />
      <RefundSheet open={refundOpen} onClose={() => setRefundOpen(false)} ticketId={ticket?.id} />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
      <UpgradeSheet open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
