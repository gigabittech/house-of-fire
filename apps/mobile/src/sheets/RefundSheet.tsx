'use client';

import { colors } from '@hof/design-tokens';
import { Icon } from '@hof/ui';
import { useEffect, useState } from 'react';
import SheetShell from './SheetShell';

interface RefundSheetProps {
  open: boolean;
  onClose: () => void;
  ticketId?: string;
}

type Stage = 'form' | 'sent';

interface Reason {
  key: string;
  title: string;
  sub: string;
}

const REASONS: Reason[] = [
  { key: 'emergency', title: 'Emergency / illness', sub: 'We make exceptions for real ones.' },
  { key: 'travel', title: 'Travel fell through', sub: "Bummer — let's see what we can do." },
  { key: 'mistake', title: 'Bought by mistake', sub: "No problem if it's within 24h." },
  { key: 'other', title: 'Something else', sub: 'Tell us in your note.' },
];

export default function RefundSheet({ open, onClose, ticketId }: RefundSheetProps) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [stage, setStage] = useState<Stage>('form');

  useEffect(() => {
    if (!open) {
      setStage('form');
      setReason('');
      setDetail('');
    }
  }, [open]);

  function PrimaryBtn({
    disabled,
    onClick,
    children,
  }: {
    disabled?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
  }) {
    return (
      <button
        disabled={disabled}
        onClick={onClick}
        className="hof-btn hof-press"
        style={{
          width: '100%',
          padding: '14px',
          background: disabled ? colors.elevated : colors.amber,
          border: `1px solid ${disabled ? colors.border : colors.amber}`,
          borderRadius: 10,
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: 15,
          color: disabled ? colors.textDis : colors.bg,
          opacity: disabled ? 0.7 : 1,
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <SheetShell
      open={open}
      onClose={onClose}
      title="Refund request"
      sub="Tickets are non-refundable, but we read every request."
    >
      {stage === 'form' && (
        <>
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 11,
              color: colors.textSec,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            What happened?
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REASONS.map((r) => (
              <button
                key={r.key}
                className="hof-btn hof-press"
                onClick={() => setReason(r.key)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 14px',
                  background: reason === r.key ? colors.elevated : colors.bg,
                  border:
                    reason === r.key ? `2px solid ${colors.amber}` : `1px solid ${colors.border}`,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: colors.text }}
                >
                  {r.title}
                </div>
                <div
                  style={{ fontFamily: 'Inter', fontSize: 12, color: colors.textSec, marginTop: 2 }}
                >
                  {r.sub}
                </div>
              </button>
            ))}
          </div>

          <div style={{ height: 14 }} />
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 11,
              color: colors.textSec,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Anything else we should know?
          </div>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="A sentence is plenty."
            rows={4}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              fontFamily: 'Inter',
              fontSize: 14,
              color: colors.text,
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />

          <div
            style={{
              marginTop: 18,
              padding: 14,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
            }}
          >
            <div
              style={{ fontFamily: 'Inter', fontSize: 12, color: colors.textSec, lineHeight: 1.5 }}
            >
              Faster path: <span style={{ color: colors.amber }}>transfer your ticket</span> to a
              friend. They get to come, you get your money — no waiting on us.
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <PrimaryBtn
              disabled={!reason}
              onClick={() => {
                setStage('sent'); // optimistic
                if (!ticketId) return;
                fetch(`/api/tickets/${ticketId}/refund`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reason }),
                }).catch(console.error);
              }}
            >
              {reason ? 'Send request' : 'Pick a reason'}
            </PrimaryBtn>
          </div>
        </>
      )}

      {stage === 'sent' && (
        <>
          <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
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
              }}
            >
              <Icon name="bell" size={28} color={colors.amber} />
            </div>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 22,
                color: colors.text,
              }}
            >
              Request submitted
            </div>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: colors.textSec,
                marginTop: 8,
                lineHeight: 1.5,
                maxWidth: 280,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Jordan reviews refund requests personally. You'll hear back within 2 business days,
              usually same day during theme weeks.
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <PrimaryBtn onClick={onClose}>Done</PrimaryBtn>
          </div>
        </>
      )}
    </SheetShell>
  );
}
