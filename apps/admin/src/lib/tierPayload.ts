export type TierStatus = 'available' | 'sold_out' | 'hidden';

export interface TierFormRow {
  id?: string;
  name: string;
  display_name: string;
  description: string | null;
  price_cents: number;
  fee_cents: number;
  capacity: number;
  status: TierStatus;
  sort_order: number;
}

function slugifyName(displayName: string): string {
  const base = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return base || 'tier';
}

export function parseTierRows(
  raw: unknown,
): { ok: true; tiers: TierFormRow[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, error: 'tiers must be an array' };
  }

  const tiers: TierFormRow[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (typeof item !== 'object' || item === null) {
      return { ok: false, error: `Invalid tier at index ${i}` };
    }
    const b = item as Record<string, unknown>;

    const displayName = String(b.display_name ?? b.displayName ?? '').trim();
    if (!displayName) {
      return { ok: false, error: `Tier ${i + 1}: display name is required` };
    }

    const nameRaw = String(b.name ?? '').trim();
    const name = nameRaw || slugifyName(displayName);

    const priceCents = Number(b.price_cents ?? b.priceCents);
    if (!Number.isInteger(priceCents) || priceCents < 0) {
      return { ok: false, error: `Tier ${i + 1}: invalid ticket price` };
    }

    const feeCents = Number(b.fee_cents ?? b.feeCents ?? 0);
    if (!Number.isInteger(feeCents) || feeCents < 0) {
      return { ok: false, error: `Tier ${i + 1}: invalid service fee` };
    }

    const capacity = Number(b.capacity);
    if (!Number.isInteger(capacity) || capacity < 0) {
      return { ok: false, error: `Tier ${i + 1}: invalid capacity` };
    }

    const status = String(b.status ?? 'available') as TierStatus;
    if (!['available', 'sold_out', 'hidden'].includes(status)) {
      return { ok: false, error: `Tier ${i + 1}: invalid status` };
    }

    const sortOrder = Number(b.sort_order ?? b.sortOrder ?? i);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return { ok: false, error: `Tier ${i + 1}: invalid sort order` };
    }

    const description =
      b.description === null || b.description === undefined || b.description === ''
        ? null
        : String(b.description).trim();

    const id = b.id === undefined || b.id === null || b.id === '' ? undefined : String(b.id);

    tiers.push({
      id,
      name,
      display_name: displayName,
      description,
      price_cents: priceCents,
      fee_cents: feeCents,
      capacity,
      status,
      sort_order: sortOrder,
    });
  }

  return { ok: true, tiers };
}

export function tierRowToDbInsert(eventId: string, tier: TierFormRow) {
  return {
    event_id: eventId,
    name: tier.name,
    display_name: tier.display_name,
    description: tier.description,
    price_cents: tier.price_cents,
    fee_cents: tier.fee_cents,
    capacity: tier.capacity,
    doors_start: null,
    doors_end: null,
    stripe_price_id: null,
    status: tier.status,
    sort_order: tier.sort_order,
  };
}
