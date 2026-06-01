'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { colors } from '@hof/design-tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransferDetails {
  id: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  to_email: string;
  ticket: {
    id: string;
    code: string;
    tier: {
      name: string;
      display_name: string;
    };
    event: {
      edition_number: number;
      name: string;
    };
  };
}

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function AcceptTransferContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [transfer, setTransfer] = useState<TransferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('No transfer ID provided.');
      setLoading(false);
      return;
    }

    const init = async () => {
      // Check auth status by probing a protected endpoint
      try {
        const authRes = await fetch('/api/profile');
        setIsLoggedIn(authRes.ok);
      } catch {
        setIsLoggedIn(false);
      }

      // Fetch transfer details
      try {
        const res = await fetch(`/api/accept-transfer?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          setError(body.error ?? 'Transfer not found.');
          return;
        }
        const body = (await res.json()) as { transfer: TransferDetails };
        setTransfer(body.transfer);
      } catch {
        setError('Failed to load transfer details.');
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [id]);

  const handleAccept = async () => {
    if (!id) return;
    setAccepting(true);
    try {
      const res = await fetch('/api/accept-transfer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Failed to accept transfer.');
        return;
      }
      setAccepted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  // ─── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <p style={{ color: colors.textSec, fontFamily: 'Inter', fontSize: 14 }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <p style={labelStyle}>Transfer</p>
          <p style={{ color: colors.error, fontFamily: 'Inter', fontSize: 16, marginBottom: 8 }}>
            {error}
          </p>
          <p style={{ color: colors.textSec, fontFamily: 'Inter', fontSize: 13 }}>
            The link may have expired or already been used.
          </p>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <p style={labelStyle}>Ticket accepted</p>
          <h1 style={headingStyle}>
            You&apos;re in.
          </h1>
          <p style={{ color: colors.textSec, fontFamily: 'Inter', fontSize: 15, marginBottom: 32 }}>
            Your ticket for Edition {transfer?.ticket.event.edition_number} has been added to your
            account.
          </p>
          <a
            href="/ticket"
            style={buttonStyle}
          >
            View my ticket
          </a>
        </div>
      </div>
    );
  }

  if (!transfer) return null;

  const isExpired =
    transfer.status !== 'pending' || new Date(transfer.expires_at) < new Date();

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <p style={labelStyle}>House of Fire</p>
        <h1 style={headingStyle}>
          You&apos;ve been gifted a ticket to House of Fire Edition{' '}
          {transfer.ticket.event.edition_number}
        </h1>

        <div style={detailBlockStyle}>
          <div style={detailRowStyle}>
            <span style={detailLabelStyle}>Event</span>
            <span style={detailValueStyle}>
              Edition {transfer.ticket.event.edition_number} — {transfer.ticket.event.name}
            </span>
          </div>
          <div style={detailRowStyle}>
            <span style={detailLabelStyle}>Tier</span>
            <span style={detailValueStyle}>{transfer.ticket.tier.display_name}</span>
          </div>
        </div>

        {isExpired ? (
          <p style={{ color: colors.error, fontFamily: 'Inter', fontSize: 14 }}>
            This transfer has expired or is no longer available.
          </p>
        ) : isLoggedIn ? (
          <button
            style={accepting ? { ...buttonStyle, opacity: 0.6, cursor: 'not-allowed' } : buttonStyle}
            onClick={handleAccept}
            disabled={accepting}
            type="button"
          >
            {accepting ? 'Accepting...' : 'Accept ticket'}
          </button>
        ) : (
          <div>
            <p
              style={{
                color: colors.textSec,
                fontFamily: 'Inter',
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              Sign in or create an account to claim your ticket.
            </p>
            <a href="/onboarding" style={buttonStyle}>
              Sign in / Create account
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: '100dvh',
  background: colors.bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
  boxSizing: 'border-box',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: colors.elevated,
  border: `1px solid ${colors.border}`,
  borderRadius: 16,
  padding: 32,
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'Inter',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: colors.amber,
  marginBottom: 12,
};

const headingStyle: React.CSSProperties = {
  fontFamily: 'Inter',
  fontSize: 22,
  fontWeight: 700,
  color: colors.text,
  lineHeight: 1.3,
  marginBottom: 24,
};

const detailBlockStyle: React.CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  padding: '16px 20px',
  marginBottom: 28,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const detailRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const detailLabelStyle: React.CSSProperties = {
  fontFamily: 'Inter',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.textSec,
};

const detailValueStyle: React.CSSProperties = {
  fontFamily: 'Inter',
  fontSize: 15,
  fontWeight: 500,
  color: colors.text,
};

const buttonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px 24px',
  background: colors.amber,
  color: '#fff',
  fontFamily: 'Inter',
  fontSize: 15,
  fontWeight: 600,
  textAlign: 'center',
  textDecoration: 'none',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
};

// ─── Page export ──────────────────────────────────────────────────────────────

export default function AcceptTransferPage() {
  return (
    <Suspense>
      <AcceptTransferContent />
    </Suspense>
  );
}
