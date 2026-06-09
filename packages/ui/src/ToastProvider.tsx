'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { HofToast } from './HofToast';
import type { ToastKind } from './HofToast';

export type ToastPlacement = 'default' | 'above-composer' | 'top';

export interface ToastOptions {
  kind?: ToastKind;
  /** Milliseconds before auto-dismiss; `0` keeps the toast open until dismissed. */
  duration?: number;
  placement?: ToastPlacement;
}

interface ToastState {
  id: number;
  kind: ToastKind;
  message: string;
  placement: ToastPlacement;
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
  dismissToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function toastViewportClass(placement: ToastPlacement): string {
  if (placement === 'top') return 'hof-toast-viewport hof-toast-viewport--top';
  if (placement === 'above-composer') return 'hof-toast-viewport hof-toast-viewport--above-composer';
  return 'hof-toast-viewport';
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismissToast = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const { kind = 'success', duration = 4000, placement = 'default' } = options;
      clearTimeout(timeoutRef.current);
      setToast({ id: Date.now(), kind, message, placement });
      if (duration > 0) {
        timeoutRef.current = setTimeout(dismissToast, duration);
      }
    },
    [dismissToast],
  );

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div className={toastViewportClass(toast.placement)} role="status" aria-live="polite">
          <HofToast kind={toast.kind} onDismiss={dismissToast}>
            {toast.message}
          </HofToast>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

/** Show app-wide toast notifications (requires `ToastProvider`). */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
