'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Dev must not cache /_next/static — stale chunks break UI after soft refresh.
      void navigator.serviceWorker?.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return null;
}
