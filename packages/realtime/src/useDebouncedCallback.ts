'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs: number,
): T {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      pendingRef.current = args;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (delayMs <= 0) {
        callbackRef.current(...args);
        return;
      }
      timerRef.current = setTimeout(() => {
        if (pendingRef.current) {
          callbackRef.current(...(pendingRef.current as Parameters<T>));
          pendingRef.current = null;
        }
      }, delayMs);
    }) as T,
    [delayMs],
  );
}
