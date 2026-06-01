'use client';

import { useState, useEffect } from 'react';

/** Returns { mounted, shown } to drive enter/exit animation for bottom sheets. */
export function useSheet(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Two rAFs so the DOM is painted before the CSS transition fires
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return;
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 240);
    return () => clearTimeout(t);
  }, [open]);

  return { mounted, shown };
}
