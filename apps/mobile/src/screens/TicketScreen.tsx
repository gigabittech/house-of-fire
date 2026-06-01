'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@hof/design-tokens';
import { Icon, FakeQR, HofToast, HofSkeleton, EmptyState, useResponsive } from '@hof/ui';
import type { ToastKind } from '@hof/ui';
import QRCode from 'qrcode';
import TransferSheet from '../sheets/TransferSheet.js';
import RefundSheet from '../sheets/RefundSheet.js';
import { ShareSheet } from '../sheets/ShareSheet.js';
import { UpgradeSheet } from '../sheets/UpgradeSheet.js';

export default function TicketScreen() {
  const router = useRouter();
  const [transferOpen, setTransferOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [toast, setToast] = useState<{ shown: boolean; kind: ToastKind; message: string }>({
    shown: false,
    kind: 'success',
    message: '',
  });
  const [ticket, setTicket] = useState<null | {
    id: string;
    code: string;
    qr_data: string;
    status: string;
    purchased_at: string;
    amount_cents: number;
    fee_cents: number;
    events: { name: string; date: string; edition_number: number; venue_name: string; venue_address: string } | null;
    ticket_tiers: { display_name: string } | null;
  }>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [ticketError, setTicketError] = useState(false);
  const { isWide } = useResponsive();

  useEffect(() => {
    fetch('/api/tickets/mine')
      .then(r => r.json())
      .then(async (d: { tickets?: typeof ticket[] }) => {
        const t = d.tickets?.[0];
        if (t) {
          setTicket(t);
          try {
            const url = await QRCode.toDataURL(t.qr_data, {
              errorCorrectionLevel: 'H', margin: 2, width: 400,
              color: { dark: '#1a1a1a', light: '#f5f0e8' },
            });
            setQrDataUrl(url);
          } catch (e) { console.error(e); }
        }
      })
      .catch(() => setTicketError(true))
      .finally(() => setLoading(false));
  }, []);

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
        ) : !ticket ? (
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

        {!loading && !ticketError && ticket !== null && (
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
              Doors open at 8 PM. Side entrance on 23rd.
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
            See you Friday. The QR below is your ticket — open this screen at
            the door.
          </div>
        </div>

        {/* Ticket card */}
        <div style={{ padding: '0 16px' }}>
          <div
            style={{
              background: colors.text,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow:
                '0 12px 40px rgba(232,101,26,0.15), 0 0 0 1px rgba(240,237,230,0.1)',
              position: 'relative',
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
                    Edition 24 · Admit one
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
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
                    ['Date', 'Fri · Jun 26 · 2026'],
                    ['Doors', '8:00 PM'],
                    ['Venue', 'Junkyard Social Club'],
                    ['Holder', 'Sujan Bhuiyan'],
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
                <img src={qrDataUrl} alt="Ticket QR" style={{ width: 230, height: 230, objectFit: 'contain' }} />
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
              label: 'Add to Wallet', icon: 'wallet' as const, onClick: () => {
                if (!qrDataUrl) return;
                const a = document.createElement('a');
                a.href = qrDataUrl;
                a.download = `${ticket?.code ?? 'ticket'}.png`;
                a.click();
              }
            },
            { label: 'Save PDF', icon: 'download' as const, onClick: () => window.print() },
            { label: 'Transfer', icon: 'share' as const, onClick: () => setTransferOpen(true) },
            { label: 'Request refund', icon: 'bolt' as const, onClick: () => setRefundOpen(true) },
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

        {/* Transfer stub — peer transfers coming in Phase 2 */}
        <div style={{ padding: '8px 16px 0' }}>
          <button
            disabled
            title="Peer transfers coming in Phase 2"
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #2A2826',
              background: 'transparent',
              color: '#4A4844',
              fontFamily: 'Inter',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            Transfer <span style={{ fontSize: 10, color: '#4A4844' }}>· Coming soon</span>
          </button>
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
                ['Order', 'HOF—24—4218'],
                ['Date', 'Jun 18, 2026 · 4:14 PM'],
                ['Card', 'Visa ···· 4242'],
                ['Subtotal', '$28.00'],
                ['Fees', '$1.96'],
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
              <span>$29.96</span>
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
        onTransferred={() => showToast('success', "Ticket transferred — they have 24h to accept.")}
      />
      <RefundSheet open={refundOpen} onClose={() => setRefundOpen(false)} />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
      <UpgradeSheet open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
