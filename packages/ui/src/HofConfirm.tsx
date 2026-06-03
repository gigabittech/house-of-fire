import { colors, fontFamilies } from '@hof/design-tokens';
import { useEffect, useState } from 'react';
import { HofButton } from './HofButton';

export interface HofConfirmProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function HofConfirm({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: HofConfirmProps) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setShown(true);
        });
        return raf2;
      });
      return () => cancelAnimationFrame(raf1);
    } else {
      setShown(false);
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          opacity: shown ? 1 : 0,
          transition: 'opacity 180ms ease-out',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 201,
          width: '100%',
          maxWidth: 340,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          padding: 24,
          opacity: shown ? 1 : 0,
          transition: 'opacity 200ms ease-out',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontFamily: fontFamilies.display,
            fontWeight: 600,
            fontSize: 20,
            color: colors.text,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </div>
        {body !== undefined && (
          <div
            style={{
              fontFamily: fontFamilies.body,
              fontSize: 13,
              color: colors.textSec,
              marginTop: 8,
              lineHeight: 1.55,
            }}
          >
            {body}
          </div>
        )}
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            gap: 10,
          }}
        >
          <HofButton variant="ghost" size="md" onClick={onCancel} full>
            {cancelLabel}
          </HofButton>
          <HofButton
            variant={destructive ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            full
          >
            {confirmLabel}
          </HofButton>
        </div>
      </div>
    </>
  );
}
