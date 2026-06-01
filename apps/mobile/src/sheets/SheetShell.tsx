'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@hof/design-tokens';
import { Icon } from '@hof/ui';
import { useSheet } from './useSheet.js';

interface SheetShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
}

export default function SheetShell({ open, onClose, title, sub, children }: SheetShellProps) {
  const { mounted, shown } = useSheet(open);
  if (!mounted) return null;

  const scrim: CSSProperties = {
    position: 'absolute', inset: 0, zIndex: 80,
    background: 'rgba(0,0,0,0.55)',
    opacity: shown ? 1 : 0,
    transition: 'opacity 200ms ease-out',
  };
  const sheet: CSSProperties = {
    position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 90,
    background: colors.surface,
    borderTop: `1px solid ${colors.border}`,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    transform: shown ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 240ms cubic-bezier(0.22, 0.84, 0.36, 1)',
    boxShadow: '0 -24px 60px rgba(0,0,0,0.55)',
    maxHeight: '88%',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <>
      <div style={scrim} onClick={onClose} />
      <div style={sheet}>
        {/* Grabber */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: colors.border, margin: '12px auto 6px',
        }} />
        {/* Header */}
        <div style={{
          padding: '6px 18px 14px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20,
              color: colors.text, letterSpacing: '-0.01em',
            }}>{title}</div>
            {sub && (
              <div style={{
                fontFamily: 'Inter', fontSize: 12, color: colors.textSec, marginTop: 2,
              }}>{sub}</div>
            )}
          </div>
          <button
            className="hof-btn hof-press"
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 16,
              background: colors.elevated, border: `1px solid ${colors.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="close" size={14} color={colors.textSec} />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="hof-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 34px' }}>
          {children}
        </div>
      </div>
    </>
  );
}
