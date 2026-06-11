'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    const shouldRegister =
      'serviceWorker' in navigator &&
      (process.env.NODE_ENV === 'production' || Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY));
    if (shouldRegister) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return null;
}
