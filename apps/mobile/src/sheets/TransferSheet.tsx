'use client';

import { useState, useEffect } from 'react';
import { colors } from '@hof/design-tokens';
import { Icon } from '@hof/ui';
import SheetShell from './SheetShell.js';

interface TransferSheetProps {
  open: boolean;
  onClose: () => void;
  onTransferred?: () => void;
  ticketId?: string;
}

type Stage = 'form' | 'confirm' | 'sent';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TransferSheet({ open, onClose, onTransferred, ticketId }: TransferSheetProps) {
  const [stage, setStage] = useState<Stage>('form');
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote]   = useState('');

  const valid = name.trim().length > 0 && EMAIL_RE.test(email);

  useEffect(() => {
    if (!open) { setStage('form'); setName(''); setEmail(''); setNote(''); }
  }, [open]);

  function Label({ children }: { children: React.ReactNode }) {
    return (
      <div style={{
        fontFamily: 'Inter', fontSize: 11, color: colors.textSec,
        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8,
      }}>{children}</div>
    );
  }

  function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
      <input
        {...props}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '12px 14px',
          background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8,
          fontFamily: 'Inter', fontSize: 14, color: colors.text, outline: 'none',
        }}
      />
    );
  }

  function PrimaryBtn({ disabled, onClick, children }: {
    disabled?: boolean; onClick?: () => void; children: React.ReactNode;
  }) {
    return (
      <button
        disabled={disabled}
        onClick={onClick}
        className="hof-btn hof-press"
        style={{
          width: '100%', padding: '14px',
          background: disabled ? colors.elevated : colors.amber,
          border: `1px solid ${disabled ? colors.border : colors.amber}`,
          borderRadius: 10,
          fontFamily: 'Inter', fontWeight: 600, fontSize: 15,
          color: disabled ? colors.textDis : colors.bg,
          opacity: disabled ? 0.7 : 1,
        }}
      >{children}</button>
    );
  }

  return (
    <SheetShell
      open={open}
      onClose={onClose}
      title="Transfer your ticket"
      sub="Fireversary · Edition 24 · GA · $28"
    >
      {stage === 'form' && (
        <>
          <Label>Who's it going to?</Label>
          <FieldInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Their full name"
          />

          <div style={{ height: 12 }} />
          <Label>Their email</Label>
          <FieldInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            type="email"
          />
          <div style={{
            fontFamily: 'Inter', fontSize: 12, color: colors.textSec, marginTop: 6, lineHeight: 1.5,
          }}>They'll get the new ticket here. We'll verify their phone at the door.</div>

          <div style={{ height: 12 }} />
          <Label>Add a note (optional)</Label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Have fun. Don't lose the QR."
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '12px 14px',
              background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8,
              fontFamily: 'Inter', fontSize: 14, color: colors.text, outline: 'none',
              resize: 'vertical', lineHeight: 1.5,
            }}
          />

          <div style={{
            marginTop: 18, padding: 14,
            background: 'rgba(232,162,26,0.08)',
            border: `1px solid rgba(232,162,26,0.3)`, borderRadius: 10,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <Icon name="bolt" size={16} color={colors.warning} />
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: colors.text, lineHeight: 1.5 }}>
              One transfer per ticket. Once they accept, you can't un-transfer. Cutoff is 24h before doors.
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <PrimaryBtn disabled={!valid} onClick={() => setStage('confirm')}>
              {valid ? 'Review & send' : 'Fill in their info'}
            </PrimaryBtn>
          </div>
        </>
      )}

      {stage === 'confirm' && (
        <>
          <div style={{
            padding: 16, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 12,
          }}>
            <div style={{
              fontFamily: 'Inter', fontSize: 11, color: colors.amber,
              letterSpacing: '0.18em', textTransform: 'uppercase',
            }}>You're transferring</div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
              color: colors.text, marginTop: 6,
            }}>Fireversary · GA · Ed 24</div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.border}` }}>
              <div style={{
                fontFamily: 'Inter', fontSize: 11, color: colors.amber,
                letterSpacing: '0.18em', textTransform: 'uppercase',
              }}>To</div>
              <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 15, color: colors.text, marginTop: 6 }}>
                {name}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: colors.textSec, marginTop: 2 }}>
                {email}
              </div>
            </div>
            {note && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.border}` }}>
                <div style={{
                  fontFamily: 'Inter', fontSize: 11, color: colors.amber,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                }}>Your note</div>
                <div style={{
                  fontFamily: 'Inter', fontSize: 13, color: colors.text, marginTop: 6,
                  fontStyle: 'italic', lineHeight: 1.5,
                }}>"{note}"</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button
              className="hof-btn hof-press"
              onClick={() => setStage('form')}
              style={{
                padding: '13px 18px', borderRadius: 10,
                background: colors.elevated, border: `1px solid ${colors.border}`,
                fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: colors.text,
              }}
            >Edit</button>
            <div style={{ flex: 1 }}>
              <PrimaryBtn onClick={() => {
                setStage('sent'); // optimistic
                if (!ticketId) return;
                fetch(`/api/tickets/${ticketId}/transfer`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ recipientEmail: email, message: note }),
                }).catch(console.error);
              }}>Send transfer</PrimaryBtn>
            </div>
          </div>
        </>
      )}

      {stage === 'sent' && (
        <>
          <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
            <div style={{
              width: 64, height: 64, margin: '0 auto 16px', borderRadius: 32,
              background: 'rgba(76,175,110,0.15)', border: `2px solid ${colors.success}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="check" size={32} color={colors.success} />
            </div>
            <div style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22, color: colors.text }}>
              Transfer sent
            </div>
            <div style={{
              fontFamily: 'Inter', fontSize: 13, color: colors.textSec, marginTop: 8, lineHeight: 1.5,
              maxWidth: 260, marginLeft: 'auto', marginRight: 'auto',
            }}>
              {name} has 24 hours to accept. We'll text you when they do — and your ticket disappears from this app.
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <PrimaryBtn onClick={() => { onTransferred?.(); onClose(); }}>Done</PrimaryBtn>
          </div>
        </>
      )}
    </SheetShell>
  );
}
