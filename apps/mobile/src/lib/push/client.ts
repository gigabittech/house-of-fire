function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function fetchVapidPublicKey(): Promise<string | null> {
  const res = await fetch('/api/push/vapid-public-key');
  if (!res.ok) return null;
  const data = (await res.json()) as { publicKey?: string };
  return data.publicKey?.trim() || null;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js');
}

export async function subscribeToWebPush(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!('Notification' in window) || !('PushManager' in window)) {
    return { ok: false, error: 'Push notifications are not supported in this browser.' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, error: 'Notification permission was denied.' };
  }

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) {
    return { ok: false, error: 'Push is not configured on the server.' };
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration?.pushManager) {
    return { ok: false, error: 'Service worker is not available.' };
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return { ok: false, error: 'Could not read push subscription keys.' };
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint,
      p256dh,
      auth,
      platform: 'web',
    }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: data.error ?? 'Failed to save push subscription.' };
  }

  return { ok: true };
}

export async function unsubscribeFromWebPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe().catch(() => undefined);

  await fetch('/api/push/subscribe', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  }).catch(() => undefined);
}

export async function syncPushSubscription(enabled: boolean): Promise<string | null> {
  if (!enabled) {
    await unsubscribeFromWebPush();
    return null;
  }
  const result = await subscribeToWebPush();
  return result.ok ? null : result.error;
}
