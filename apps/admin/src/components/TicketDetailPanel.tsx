'use client';

import QRCode from 'qrcode';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Pill } from '@/components/Pill';
import {
  formatCents,
  formatPurchasedAt,
  guestAvatarUrl,
  guestDisplayName,
  guestEmail,
  guestTierLabel,
  receiptForTicket,
  receiptText,
  type AdminGuestTicket,
} from '@/lib/guestTicket';

interface TicketDetailPanelProps {
  ticket: AdminGuestTicket | null;
  allTickets: AdminGuestTicket[];
  onClose: () => void;
}

function statusTone(
  status: AdminGuestTicket['status'],
): 'success' | 'danger' | 'neutral' | 'warning' {
  if (status === 'used' || status === 'valid') return 'success';
  if (status === 'refunded' || status === 'cancelled') return 'danger';
  if (status === 'transferred') return 'warning';
  return 'neutral';
}

const eyebrow: CSSProperties = {
  fontFamily: 'Inter, system-ui',
  fontSize: 10,
  color: 'var(--hof-text-sec)',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
};

const card: CSSProperties = {
  background: 'var(--hof-surface)',
  border: '1px solid var(--hof-border)',
  borderRadius: 12,
  overflow: 'hidden',
};

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        background: 'var(--hof-elevated)',
        border: '1px solid var(--hof-border)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
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
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          ...eyebrow,
          letterSpacing: '0.14em',
          marginBottom: 4,
          color: 'var(--hof-text-dis)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Inter, system-ui',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--hof-text)',
          lineHeight: 1.35,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CopyableId({ label, value }: { label: string; value: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ ...eyebrow, letterSpacing: '0.12em', marginBottom: 6 }}>{label}</div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'stretch',
          background: 'var(--hof-elevated)',
          border: '1px solid var(--hof-border)',
          borderRadius: 8,
          padding: '8px 10px',
        }}
      >
        <code
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: 'var(--hof-text-sec)',
            wordBreak: 'break-all',
            flex: 1,
            lineHeight: 1.5,
          }}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--hof-border)',
            background: 'var(--hof-surface)',
            fontFamily: 'Inter, system-ui',
            fontSize: 10,
            fontWeight: 500,
            cursor: 'pointer',
            color: copied ? 'var(--hof-success)' : 'var(--hof-text-sec)',
            whiteSpace: 'nowrap',
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function TicketStubCard({
  ticket,
  qrUrl,
  qrLoading,
}: {
  ticket: AdminGuestTicket;
  qrUrl: string;
  qrLoading: boolean;
}) {
  const ev = ticket.events;
  const tier = guestTierLabel(ticket);
  const isVip = tier.toLowerCase().includes('vip');

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        background: 'var(--hof-text)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.35), 0 0 0 1px rgba(240,237,230,0.06)',
      }}
    >
      <div style={{ padding: '18px 18px 14px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'Inter, system-ui',
                fontSize: 10,
                color: 'var(--hof-bg)',
                opacity: 0.55,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              {ev ? `Edition ${ev.edition_number} · Admit one` : 'House of Fire'}
            </div>
            <div
              style={{
                fontFamily: 'Clash Display, system-ui',
                fontWeight: 600,
                fontSize: 18,
                color: 'var(--hof-bg)',
                marginTop: 8,
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}
            >
              {ev?.name ?? 'Event'}
            </div>
            <div
              style={{
                fontFamily: 'Inter, system-ui',
                fontSize: 12,
                color: 'var(--hof-bg)',
                opacity: 0.65,
                marginTop: 6,
              }}
            >
              {guestDisplayName(ticket)}
            </div>
          </div>
          <span
            style={{
              padding: '5px 10px',
              background: isVip ? 'var(--hof-gold)' : 'var(--hof-amber)',
              color: 'var(--hof-bg)',
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            {tier}
          </span>
        </div>
      </div>

      {/* Perforation */}
      <div style={{ position: 'relative', height: 16 }}>
        <div
          style={{
            position: 'absolute',
            left: -9,
            top: '50%',
            width: 18,
            height: 18,
            background: 'var(--hof-bg)',
            borderRadius: 9,
            transform: 'translateY(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: -9,
            top: '50%',
            width: 18,
            height: 18,
            background: 'var(--hof-bg)',
            borderRadius: 9,
            transform: 'translateY(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            top: '50%',
            borderTop: '1.5px dashed rgba(245,240,232,0.22)',
          }}
        />
      </div>

      <div
        style={{
          padding: '8px 18px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            background: '#f5f0e8',
            borderRadius: 10,
            padding: 12,
            minHeight: 200,
            minWidth: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {qrLoading && (
            <span
              style={{
                fontFamily: 'Inter, system-ui',
                fontSize: 12,
                color: 'rgba(10,10,8,0.5)',
              }}
            >
              Generating QR…
            </span>
          )}
          {!qrLoading && qrUrl && (
            // biome-ignore lint/performance/noImgElement: data URL from qrcode
            <img src={qrUrl} alt={`QR for ${ticket.code}`} width={176} height={176} />
          )}
          {!qrLoading && !qrUrl && (
            <span style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: '#c44' }}>
              QR unavailable
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            color: 'var(--hof-bg)',
            letterSpacing: '0.14em',
            fontWeight: 500,
          }}
        >
          {ticket.code}
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: 'Inter, system-ui',
            fontSize: 11,
            color: 'var(--hof-bg)',
            opacity: 0.45,
          }}
        >
          Scan at door · valid entry pass
        </div>
      </div>
    </div>
  );
}

export function TicketDetailPanel({ ticket, allTickets, onClose }: TicketDetailPanelProps) {
  const [qrUrl, setQrUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const loadQr = useCallback(async (t: AdminGuestTicket) => {
    setQrLoading(true);
    try {
      const url = await QRCode.toDataURL(t.qr_data, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 320,
        color: { dark: '#0A0A08', light: '#f5f0e8' },
      });
      setQrUrl(url);
    } catch {
      setQrUrl('');
    } finally {
      setQrLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ticket) {
      void loadQr(ticket);
    } else {
      setQrUrl('');
    }
  }, [ticket, loadQr]);

  if (!ticket) return null;

  const receipt = receiptForTicket(ticket, allTickets);
  const ev = ticket.events;
  const name = guestDisplayName(ticket);
  const initials = name
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('');
  const tier = guestTierLabel(ticket);
  const isVip = tier.toLowerCase().includes('vip');

  function downloadReceipt() {
    const text = receiptText(ticket!, receipt);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${ticket!.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function resendReceiptEmail() {
    const orderId = ticket?.orders?.id ?? ticket?.order_id;
    if (!orderId || receipt.kind !== 'order') return;
    setResendLoading(true);
    setResendMessage(null);
    setResendError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resend-receipt`, { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as { error?: string; recipient?: string };
      if (!res.ok) {
        setResendError(data.error ?? 'Could not resend receipt.');
        return;
      }
      setResendMessage(data.recipient ? `Receipt resent to ${data.recipient}.` : 'Receipt resent.');
    } catch {
      setResendError('Network error — try again.');
    } finally {
      setResendLoading(false);
    }
  }

  const eventDate = ev
    ? new Date(ev.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.52)',
          border: 0,
          cursor: 'pointer',
          zIndex: 40,
        }}
      />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(440px, 100vw)',
          background: 'var(--hof-bg)',
          borderLeft: '1px solid var(--hof-border)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 22px 16px',
            borderBottom: '1px solid var(--hof-border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={eyebrow}>Ticket detail</div>
              <div
                style={{
                  fontFamily: 'Clash Display, system-ui',
                  fontWeight: 600,
                  fontSize: 22,
                  color: 'var(--hof-text)',
                  marginTop: 4,
                  letterSpacing: '-0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: 'var(--hof-text-sec)',
                  marginTop: 6,
                }}
              >
                {ticket.code}
              </div>
            </div>
            <CloseButton onClick={onClose} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            <Pill tone={statusTone(ticket.status)} size="sm">
              {ticket.status}
            </Pill>
            <Pill tone={isVip ? 'gold' : 'neutral'} size="sm">
              {tier}
            </Pill>
            <Pill tone="muted" size="sm">
              {ticket.source}
            </Pill>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 28px' }}>
          <TicketStubCard ticket={ticket} qrUrl={qrUrl} qrLoading={qrLoading} />

          {/* Guest */}
          <div style={{ ...card, marginTop: 16, padding: '14px 16px' }}>
            <div style={{ ...eyebrow, marginBottom: 10 }}>Guest</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar initials={initials} src={guestAvatarUrl(ticket)} alt={name} size={40} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontWeight: 600,
                    fontSize: 15,
                    color: 'var(--hof-text)',
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontSize: 12,
                    color: 'var(--hof-text-sec)',
                    marginTop: 3,
                    wordBreak: 'break-word',
                  }}
                >
                  {guestEmail(ticket)}
                </div>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ ...card, marginTop: 12, padding: '14px 16px' }}>
            <div style={{ ...eyebrow, marginBottom: 12 }}>Details</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px 12px',
              }}
            >
              <DetailCell
                label="Event"
                value={ev ? `Ed. ${ev.edition_number} · ${ev.name}` : '—'}
              />
              <DetailCell label="Date" value={eventDate} />
              <DetailCell label="Venue" value={ev?.venue_name ?? '—'} />
              <DetailCell label="Purchased" value={formatPurchasedAt(ticket.purchased_at)} />
              {ticket.used_at && (
                <DetailCell label="Used" value={formatPurchasedAt(ticket.used_at)} />
              )}
              {ticket.checked_in_at && (
                <DetailCell label="Checked in" value={formatPurchasedAt(ticket.checked_in_at)} />
              )}
            </div>
          </div>

          {/* Receipt */}
          <div style={{ ...card, marginTop: 12 }}>
            <div
              style={{
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--hof-border)',
              }}
            >
              <div style={eyebrow}>Receipt</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {receipt.kind === 'order' && (ticket.orders?.id ?? ticket.order_id) ? (
                  <button
                    type="button"
                    disabled={resendLoading}
                    onClick={() => {
                      void resendReceiptEmail();
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--hof-border)',
                      background: 'var(--hof-elevated)',
                      fontFamily: 'Inter, system-ui',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--hof-text)',
                      cursor: resendLoading ? 'wait' : 'pointer',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {resendLoading ? 'Sending…' : 'Resend email'}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={downloadReceipt}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--hof-amber)',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--hof-bg)',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  Download
                </button>
              </div>
            </div>
            <div style={{ padding: '12px 16px 14px' }}>
              {[
                ['Subtotal', formatCents(receipt.subtotal)],
                ...(receipt.discount > 0
                  ? [['Discount', `−${formatCents(receipt.discount)}`] as const]
                  : []),
                ['Fees', formatCents(receipt.fees)],
                ...(receipt.payMethod ? [['Payment', receipt.payMethod] as const] : []),
                ['Tickets in order', String(receipt.ticketCount)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    fontFamily: 'Inter, system-ui',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: 'var(--hof-text-sec)', fontSize: 12 }}>{label}</span>
                  <span style={{ color: 'var(--hof-text)', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  marginTop: 4,
                  borderTop: '1px solid var(--hof-border)',
                  fontFamily: 'Clash Display, system-ui',
                  fontWeight: 600,
                  fontSize: 18,
                  color: 'var(--hof-text)',
                }}
              >
                <span>Total</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatCents(receipt.total)}
                </span>
              </div>
              <CopyableId label="Stripe Payment Intent" value={receipt.stripePaymentIntentId} />
              <CopyableId label="Charge ID" value={receipt.stripeChargeId} />
              {resendError ? (
                <div
                  style={{
                    marginTop: 10,
                    fontFamily: 'Inter, system-ui',
                    fontSize: 12,
                    color: 'var(--hof-danger, #f87171)',
                  }}
                >
                  {resendError}
                </div>
              ) : null}
              {resendMessage ? (
                <div
                  style={{
                    marginTop: 10,
                    fontFamily: 'Inter, system-ui',
                    fontSize: 12,
                    color: 'var(--hof-success, #4caf6e)',
                  }}
                >
                  {resendMessage}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
