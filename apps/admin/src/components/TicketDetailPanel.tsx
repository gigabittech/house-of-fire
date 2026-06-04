'use client';

import QRCode from 'qrcode';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Pill } from '@/components/Pill';
import {
  formatCents,
  formatPurchasedAt,
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

function statusTone(status: AdminGuestTicket['status']): 'success' | 'danger' | 'neutral' | 'warning' {
  if (status === 'used' || status === 'valid') return 'success';
  if (status === 'refunded' || status === 'cancelled') return 'danger';
  if (status === 'transferred') return 'warning';
  return 'neutral';
}

const sectionTitle: CSSProperties = {
  fontFamily: 'Inter, system-ui',
  fontSize: 10,
  color: 'var(--hof-text-sec)',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  marginBottom: 10,
};

const rowLabel: CSSProperties = {
  fontFamily: 'Inter, system-ui',
  fontSize: 11,
  color: 'var(--hof-text-sec)',
  marginBottom: 2,
};

const rowValue: CSSProperties = {
  fontFamily: 'Inter, system-ui',
  fontSize: 13,
  color: 'var(--hof-text)',
  marginBottom: 12,
};

function CopyableId({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={rowLabel}>{label}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <code
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: 'var(--hof-text-sec)',
            wordBreak: 'break-all',
            flex: 1,
          }}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(value)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid var(--hof-border)',
            background: 'var(--hof-elevated)',
            fontSize: 10,
            cursor: 'pointer',
            color: 'var(--hof-text-sec)',
          }}
        >
          Copy
        </button>
      </div>
    </div>
  );
}

export function TicketDetailPanel({ ticket, allTickets, onClose }: TicketDetailPanelProps) {
  const [qrUrl, setQrUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  const loadQr = useCallback(async (t: AdminGuestTicket) => {
    setQrLoading(true);
    try {
      const url = await QRCode.toDataURL(t.qr_data, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 280,
        color: { dark: '#1a1a1a', light: '#f5f0e8' },
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

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
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
          width: 'min(420px, 100vw)',
          background: 'var(--hof-bg)',
          borderLeft: '1px solid var(--hof-border)',
          zIndex: 50,
          overflowY: 'auto',
          padding: '24px 22px 32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={sectionTitle}>Ticket detail</div>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 14,
                color: 'var(--hof-text)',
                fontWeight: 600,
              }}
            >
              {ticket.code}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid var(--hof-border)',
              background: 'var(--hof-surface)',
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: 'pointer',
              color: 'var(--hof-text-sec)',
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={sectionTitle}>Guest</div>
          <div style={{ ...rowValue, fontWeight: 600, fontSize: 16 }}>{guestDisplayName(ticket)}</div>
          <div style={rowLabel}>Email</div>
          <div style={rowValue}>{guestEmail(ticket)}</div>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={sectionTitle}>Ticket</div>
          <div style={rowLabel}>Event</div>
          <div style={rowValue}>
            {ev ? `Edition ${ev.edition_number} · ${ev.name}` : '—'}
          </div>
          <div style={rowLabel}>Tier</div>
          <div style={{ marginBottom: 12 }}>
            <Pill tone={guestTierLabel(ticket).toLowerCase().includes('vip') ? 'gold' : 'neutral'}>
              {guestTierLabel(ticket)}
            </Pill>
          </div>
          <div style={rowLabel}>Status</div>
          <div style={{ marginBottom: 12 }}>
            <Pill tone={statusTone(ticket.status)}>{ticket.status}</Pill>
          </div>
          <div style={rowLabel}>Source</div>
          <div style={rowValue}>{ticket.source}</div>
          {ticket.used_at && (
            <>
              <div style={rowLabel}>Used at</div>
              <div style={rowValue}>{formatPurchasedAt(ticket.used_at)}</div>
            </>
          )}
          {ticket.checked_in_at && (
            <>
              <div style={rowLabel}>Checked in</div>
              <div style={rowValue}>{formatPurchasedAt(ticket.checked_in_at)}</div>
            </>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={sectionTitle}>Purchase</div>
          <div style={rowValue}>{formatPurchasedAt(ticket.purchased_at)}</div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={sectionTitle}>QR code</div>
          <div
            style={{
              background: '#f5f0e8',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              justifyContent: 'center',
              minHeight: 200,
              alignItems: 'center',
            }}
          >
            {qrLoading && (
              <span style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text-sec)' }}>
                Generating…
              </span>
            )}
            {!qrLoading && qrUrl && (
              // biome-ignore lint/performance/noImgElement: data URL from qrcode
              <img src={qrUrl} alt={`QR for ${ticket.code}`} width={220} height={220} />
            )}
            {!qrLoading && !qrUrl && (
              <span style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-error)' }}>
                Could not generate QR
              </span>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <div style={{ ...sectionTitle, marginBottom: 0 }}>Receipt</div>
            <button
              type="button"
              onClick={downloadReceipt}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid var(--hof-border)',
                background: 'var(--hof-elevated)',
                fontFamily: 'Inter, system-ui',
                fontSize: 11,
                color: 'var(--hof-text)',
                cursor: 'pointer',
              }}
            >
              Download
            </button>
          </div>
          <div
            style={{
              background: 'var(--hof-surface)',
              border: '1px solid var(--hof-border)',
              borderRadius: 10,
              padding: 14,
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
            }}
          >
            {[
              ['Subtotal', formatCents(receipt.subtotal)],
              ...(receipt.discount > 0 ? [['Discount', `-${formatCents(receipt.discount)}`] as const] : []),
              ['Fees', formatCents(receipt.fees)],
              ['Total', formatCents(receipt.total)],
              ['Tickets', String(receipt.ticketCount)],
              ...(receipt.payMethod ? [['Payment', receipt.payMethod] as const] : []),
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                  color: 'var(--hof-text)',
                }}
              >
                <span style={{ color: 'var(--hof-text-sec)', fontSize: 12 }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
          <CopyableId label="Stripe Payment Intent" value={receipt.stripePaymentIntentId} />
          <CopyableId label="Charge ID" value={receipt.stripeChargeId} />
        </div>
      </aside>
    </>
  );
}
