import { describe, expect, it } from 'vitest';
import { isRetryablePushStatus, isSubscriptionExpiredStatus, pushRetryDelayMs } from './retry';
import { parsePushSegment, segmentRequiresEvent } from './segments';

describe('push retry helpers', () => {
  it('treats 410/404 as expired subscriptions', () => {
    expect(isSubscriptionExpiredStatus(410)).toBe(true);
    expect(isSubscriptionExpiredStatus(404)).toBe(true);
    expect(isSubscriptionExpiredStatus(500)).toBe(false);
  });

  it('retries transient server errors', () => {
    expect(isRetryablePushStatus(500)).toBe(true);
    expect(isRetryablePushStatus(429)).toBe(true);
    expect(isRetryablePushStatus(410)).toBe(false);
  });

  it('backs off between attempts', () => {
    expect(pushRetryDelayMs(1)).toBe(250);
    expect(pushRetryDelayMs(3)).toBe(1000);
  });
});

describe('push segments', () => {
  it('parses known segments', () => {
    expect(parsePushSegment('vip_members')).toBe('vip_members');
    expect(parsePushSegment('nope')).toBeNull();
  });

  it('flags event requirement', () => {
    expect(segmentRequiresEvent('event_attendees')).toBe(true);
    expect(segmentRequiresEvent('all_members')).toBe(false);
  });
});
