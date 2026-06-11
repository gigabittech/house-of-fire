import webpush from 'web-push';
import {
  isRetryablePushStatus,
  isSubscriptionExpiredStatus,
  MAX_PUSH_ATTEMPTS,
  pushRetryDelayMs,
  sleep,
} from './retry';
import type { PushPayload, PushSendResult, PushSubscriptionKeys } from './types';
import { type VapidConfig, readVapidConfigFromEnv } from './vapid';

let configured = false;

export function configureWebPush(config?: VapidConfig): void {
  const vapid = config ?? readVapidConfigFromEnv();
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  configured = true;
}

function ensureConfigured(): void {
  if (!configured) {
    configureWebPush();
  }
}

function buildNotificationPayload(payload: PushPayload): string {
  return JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
    tag: payload.tag,
    requireInteraction: payload.requireInteraction ?? false,
  });
}

function errorStatusCode(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  const statusCode = (err as { statusCode?: number }).statusCode;
  return typeof statusCode === 'number' ? statusCode : undefined;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function sendWebPush(
  subscription: PushSubscriptionKeys,
  payload: PushPayload,
): Promise<PushSendResult> {
  ensureConfigured();

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_PUSH_ATTEMPTS; attempt++) {
    try {
      await webpush.sendNotification(pushSubscription, buildNotificationPayload(payload), {
        TTL: 60 * 60 * 24,
        urgency: 'normal',
      });
      return { ok: true, expired: false, retryable: false };
    } catch (err) {
      lastError = err;
      const statusCode = errorStatusCode(err);
      if (isSubscriptionExpiredStatus(statusCode)) {
        return {
          ok: false,
          statusCode,
          expired: true,
          errorMessage: errorMessage(err),
          retryable: false,
        };
      }
      if (attempt < MAX_PUSH_ATTEMPTS && isRetryablePushStatus(statusCode)) {
        await sleep(pushRetryDelayMs(attempt));
        continue;
      }
      return {
        ok: false,
        statusCode,
        expired: false,
        errorMessage: errorMessage(err),
        retryable: isRetryablePushStatus(statusCode),
      };
    }
  }

  return {
    ok: false,
    expired: false,
    errorMessage: errorMessage(lastError),
    retryable: true,
  };
}
