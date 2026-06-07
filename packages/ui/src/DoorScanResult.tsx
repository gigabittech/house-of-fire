'use client';

import { colors } from '@hof/design-tokens';

export type DoorScanResultState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'duplicate'
  | 'invalid'
  | 'offline_queued';

export type DoorScanResultData = {
  state: DoorScanResultState;
  attendeeName?: string;
  tierName?: string;
  ticketCode?: string;
  checkedInAt?: string;
  message?: string;
};

export type DoorScanResultProps = {
  result: DoorScanResultData | null;
  onDismiss?: () => void;
};

function formatTime(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

export function DoorScanResult({ result, onDismiss }: DoorScanResultProps) {
  if (!result || result.state === 'idle') return null;

  const configs: Record<
    Exclude<DoorScanResultState, 'idle'>,
    { bg: string; border: string; color: string; title: string }
  > = {
    loading: {
      bg: 'rgba(232,101,26,0.12)',
      border: colors.amber,
      color: colors.amber,
      title: 'Checking ticket…',
    },
    success: {
      bg: 'rgba(76,175,110,0.12)',
      border: colors.success,
      color: colors.success,
      title: 'Checked in',
    },
    duplicate: {
      bg: 'rgba(232,162,26,0.12)',
      border: colors.warning,
      color: colors.warning,
      title: 'Already checked in',
    },
    invalid: {
      bg: 'rgba(232,74,26,0.12)',
      border: colors.error,
      color: colors.error,
      title: 'Invalid ticket',
    },
    offline_queued: {
      bg: 'rgba(232,101,26,0.12)',
      border: colors.amber,
      color: colors.amber,
      title: 'Saved — will sync when online',
    },
  };

  const cfg = configs[result.state];

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: cfg.color }}>{cfg.title}</div>

          {result.state === 'success' && (
            <div style={{ marginTop: 8 }}>
              {result.attendeeName && (
                <div
                  style={{
                    fontFamily: 'Clash Display, system-ui, sans-serif',
                    fontWeight: 600,
                    fontSize: 20,
                    color: colors.text,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {result.attendeeName}
                </div>
              )}
              <div style={{ fontSize: 13, color: colors.textSec, marginTop: 4 }}>
                {[result.tierName, result.ticketCode].filter(Boolean).join(' · ')}
                {result.checkedInAt ? ` · ${formatTime(result.checkedInAt)}` : ''}
              </div>
            </div>
          )}

          {result.state === 'duplicate' && (
            <div style={{ fontSize: 13, color: colors.textSec, marginTop: 4 }}>
              {[result.attendeeName, result.tierName, result.ticketCode]
                .filter(Boolean)
                .join(' · ')}
              {result.checkedInAt
                ? ` · scanned at ${formatTime(result.checkedInAt)}`
                : result.message
                  ? ` · ${result.message}`
                  : ''}
            </div>
          )}

          {(result.state === 'invalid' || result.state === 'offline_queued') && result.message && (
            <div style={{ fontSize: 13, color: colors.textSec, marginTop: 4 }}>{result.message}</div>
          )}
        </div>

        {onDismiss && result.state !== 'loading' && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            style={{
              marginLeft: 8,
              width: 28,
              height: 28,
              borderRadius: 14,
              background: colors.elevated,
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
              color: colors.textSec,
              fontSize: 16,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
