'use client';

import { colors } from '@hof/design-tokens';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

const SCAN_COOLDOWN_MS = 3000;

export type DoorQrScannerProps = {
  onScan: (rawCode: string) => void | Promise<void>;
  scanning?: boolean;
  disabled?: boolean;
  height?: number | string;
  showManualEntry?: boolean;
};

type CameraState = 'starting' | 'live' | 'unavailable' | 'denied';

export function DoorQrScanner({
  onScan,
  scanning = false,
  disabled = false,
  height = 360,
  showManualEntry = true,
}: DoorQrScannerProps) {
  const videoId = useId().replace(/:/g, '');
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScannedRef = useRef<{ code: string; at: number } | null>(null);
  const onScanRef = useRef(onScan);

  const [cameraState, setCameraState] = useState<CameraState>('starting');
  const [manualCode, setManualCode] = useState('');
  const [manualBusy, setManualBusy] = useState(false);

  onScanRef.current = onScan;

  const tryEmitScan = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || disabled || scanning) return false;

    const now = Date.now();
    const last = lastScannedRef.current;
    if (last && last.code === trimmed && now - last.at < SCAN_COOLDOWN_MS) {
      return false;
    }

    lastScannedRef.current = { code: trimmed, at: now };
    void onScanRef.current(trimmed);
    return true;
  }, [disabled, scanning]);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof window === 'undefined' || disabled) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable');
      return;
    }

    stopCamera();
    setCameraState('starting');

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    const video = videoRef.current;
    if (!video) {
      setCameraState('unavailable');
      return;
    }

    try {
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        video,
        (result) => {
          if (result) {
            tryEmitScan(result.getText());
          }
        },
      );
      controlsRef.current = controls;
      setCameraState('live');
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraState('denied');
      } else {
        setCameraState('unavailable');
      }
      stopCamera();
    }
  }, [disabled, stopCamera, tryEmitScan]);

  useEffect(() => {
    if (disabled || scanning) {
      stopCamera();
      return () => stopCamera();
    }
    void startCamera();
    return () => stopCamera();
  }, [disabled, scanning, startCamera, stopCamera]);

  async function submitManual() {
    const code = manualCode.trim();
    if (!code || manualBusy || scanning || disabled) return;
    setManualBusy(true);
    tryEmitScan(code);
    setManualCode('');
    setManualBusy(false);
  }

  function onManualKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      void submitManual();
    }
  }

  const pillLabel =
    cameraState === 'live'
      ? 'Scanner live'
      : cameraState === 'starting'
        ? 'Starting camera…'
        : cameraState === 'denied'
          ? 'Camera denied'
          : 'Camera unavailable';

  const pillColor = cameraState === 'live' ? colors.success : colors.warning;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height,
          background: '#050503',
          overflow: 'hidden',
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
        }}
      >
        <video
          id={videoId}
          ref={videoRef}
          muted
          playsInline
          autoPlay
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: cameraState === 'live' ? 1 : 0.35,
          }}
        />

        {cameraState !== 'live' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 50% 40%, rgba(30,28,25,0.5), #050503)',
            }}
          />
        )}

        {/* Center reticle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(72%, 260px)',
            height: 'min(72%, 260px)',
            pointerEvents: 'none',
          }}
        >
          {(
            [
              ['top', 'left'],
              ['top', 'right'],
              ['bottom', 'left'],
              ['bottom', 'right'],
            ] as const
          ).map(([v, h]) => (
            <div
              key={`${v}-${h}`}
              style={{
                position: 'absolute',
                [v]: 0,
                [h]: 0,
                width: 36,
                height: 36,
                borderTop: v === 'top' ? `3px solid ${colors.amber}` : 'none',
                borderBottom: v === 'bottom' ? `3px solid ${colors.amber}` : 'none',
                borderLeft: h === 'left' ? `3px solid ${colors.amber}` : 'none',
                borderRight: h === 'right' ? `3px solid ${colors.amber}` : 'none',
                borderRadius: 6,
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              left: 6,
              right: 6,
              top: 0,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${colors.amber}, transparent)`,
              boxShadow: `0 0 12px ${colors.amber}`,
              animation: 'hof-scanline 1.8s ease-in-out infinite',
            }}
          />
        </div>

        {/* Status pill */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 4,
            background: 'rgba(20,20,18,0.7)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${colors.border}`,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 10,
            color: pillColor,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: pillColor,
              display: 'inline-block',
              animation: cameraState === 'live' ? 'hof-pulse 1.4s ease-in-out infinite' : undefined,
            }}
          />
          {pillLabel}
        </div>

        {/* Caption */}
        <div
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 16,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(20,20,18,0.78)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${colors.border}`,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12,
            color: colors.text,
            textAlign: 'center',
          }}
        >
          Hold a ticket QR up to scan
          {showManualEntry ? ' — or enter code below.' : '.'}
        </div>
      </div>

      {showManualEntry && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={manualCode}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setManualCode(e.target.value.toUpperCase())
            }
            onKeyDown={onManualKey}
            placeholder="HOF-24-0001 or paste QR data"
            autoComplete="off"
            autoCapitalize="characters"
            disabled={scanning || disabled || manualBusy}
            style={{
              flex: 1,
              height: 44,
              padding: '0 14px',
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 13,
              color: colors.text,
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => void submitManual()}
            disabled={!manualCode.trim() || scanning || disabled || manualBusy}
            style={{
              padding: '0 20px',
              height: 44,
              borderRadius: 8,
              background:
                manualCode.trim() && !scanning && !disabled ? colors.amber : colors.elevated,
              border: 'none',
              cursor:
                manualCode.trim() && !scanning && !disabled ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: manualCode.trim() && !scanning && !disabled ? colors.bg : colors.textDis,
            }}
          >
            {scanning || manualBusy ? 'Checking…' : 'Check In'}
          </button>
        </div>
      )}
    </div>
  );
}
