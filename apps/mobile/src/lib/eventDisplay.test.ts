import { describe, expect, it } from 'vitest';
import {
  eventHeroBadgeLabel,
  eventHeroBadgeTone,
  eventInventoryBadgeLabel,
  isEventSoldOut,
  type UpcomingTier,
} from './eventDisplay';

const baseEvent = { edition_number: 24, status: 'upcoming' as const };

const availableTier: UpcomingTier = {
  id: 'ga',
  name: 'ga',
  price_cents: 2800,
  capacity: 100,
  remaining: 12,
  status: 'available',
};

const soldOutTier: UpcomingTier = {
  id: 'ga',
  name: 'ga',
  price_cents: 2800,
  capacity: 100,
  remaining: 0,
  status: 'available',
  effective_status: 'sold_out',
};

describe('event status badges', () => {
  it('shows upcoming by default', () => {
    expect(eventHeroBadgeLabel(baseEvent, [availableTier])).toBe('Upcoming · Theme № 24');
  });

  it('shows live when status is live', () => {
    expect(
      eventHeroBadgeLabel({ ...baseEvent, status: 'live' }, [availableTier]),
    ).toBe('Live · Theme № 24');
  });

  it('shows sold out when all purchasable tiers are gone', () => {
    expect(eventHeroBadgeLabel(baseEvent, [soldOutTier])).toBe('Sold out · Theme № 24');
    expect(isEventSoldOut([soldOutTier])).toBe(true);
  });

  it('prioritizes sold out over live status', () => {
    expect(
      eventHeroBadgeLabel({ ...baseEvent, status: 'live' }, [soldOutTier]),
    ).toBe('Sold out · Theme № 24');
    expect(eventHeroBadgeTone({ status: 'live' }, [soldOutTier])).toBe('danger');
  });

  it('shows live inventory badge on home hero', () => {
    expect(
      eventInventoryBadgeLabel({ status: 'live' }, [availableTier]),
    ).toBe('Live · 12 left');
  });
});
