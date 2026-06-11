export const MAX_PUSH_ATTEMPTS = 3;

export function isSubscriptionExpiredStatus(statusCode: number | undefined): boolean {
  return statusCode === 404 || statusCode === 410;
}

export function isRetryablePushStatus(statusCode: number | undefined): boolean {
  if (statusCode === undefined) return true;
  if (isSubscriptionExpiredStatus(statusCode)) return false;
  if (statusCode === 429) return true;
  return statusCode >= 500;
}

export function pushRetryDelayMs(attempt: number): number {
  const base = 250;
  return Math.min(4000, base * 2 ** Math.max(0, attempt - 1));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
