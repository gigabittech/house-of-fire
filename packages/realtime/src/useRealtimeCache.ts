'use client';

import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'hof-rt-cache:';

export function readRealtimeCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeRealtimeCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function useRealtimeCache<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => readRealtimeCache<T>(key) ?? initial);

  const setCached = useCallback(
    (next: T) => {
      setValue(next);
      writeRealtimeCache(key, next);
    },
    [key],
  );

  useEffect(() => {
    const cached = readRealtimeCache<T>(key);
    if (cached !== null) setValue(cached);
  }, [key]);

  return [value, setCached];
}
