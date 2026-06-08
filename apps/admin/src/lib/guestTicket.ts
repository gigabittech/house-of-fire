export type TicketMetadata = {
  holder_name?: string | null;
  holder_email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  pay_method?: string | null;
};

export type AdminGuestProfile = {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
} | null;

export type AdminGuestTier = {
  id: string;
  display_name: string;
  name: string;
} | null;

export type AdminGuestEvent = {
  id: string;
  edition_number: number;
  name: string;
  date: string;
  venue_name: string;
  status: 'upcoming' | 'live' | 'past' | 'cancelled';
} | null;

export type AdminGuestOrder = {
  id: string;
  subtotal_cents: number;
  discount_cents: number;
  fee_cents: number;
  total_cents: number;
  stripe_payment_intent_id: string;
  status: string;
  created_at: string;
} | null;

export type AdminGuestTicket = {
  id: string;
  code: string;
  event_id: string;
  tier_id: string;
  order_id: string | null;
  amount_cents: number;
  fee_cents: number;
  status: 'valid' | 'used' | 'transferred' | 'refunded' | 'cancelled';
  purchased_at: string;
  used_at: string | null;
  checked_in_at: string | null;
  source: string;
  metadata: TicketMetadata | null;
  qr_data: string;
  stripe_charge_id: string | null;
  profiles: AdminGuestProfile;
  ticket_tiers: AdminGuestTier;
  events: AdminGuestEvent;
  orders: AdminGuestOrder;
};

function parseMetadata(raw: unknown): TicketMetadata | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as TicketMetadata;
}

export function normalizeGuestTicket(row: Record<string, unknown>): AdminGuestTicket {
  const profiles = row.profiles as AdminGuestProfile | AdminGuestProfile[] | null;
  const ticketTiers = row.ticket_tiers as AdminGuestTier | AdminGuestTier[] | null;
  const events = row.events as AdminGuestEvent | AdminGuestEvent[] | null;
  const orders = row.orders as AdminGuestOrder | AdminGuestOrder[] | null;

  return {
    id: row.id as string,
    code: row.code as string,
    event_id: row.event_id as string,
    tier_id: row.tier_id as string,
    order_id: (row.order_id as string | null) ?? null,
    amount_cents: row.amount_cents as number,
    fee_cents: (row.fee_cents as number) ?? 0,
    status: row.status as AdminGuestTicket['status'],
    purchased_at: row.purchased_at as string,
    used_at: (row.used_at as string | null) ?? null,
    checked_in_at: (row.checked_in_at as string | null) ?? null,
    source: (row.source as string) ?? 'online',
    metadata: parseMetadata(row.metadata),
    qr_data: row.qr_data as string,
    stripe_charge_id: (row.stripe_charge_id as string | null) ?? null,
    profiles: Array.isArray(profiles) ? (profiles[0] ?? null) : profiles,
    ticket_tiers: Array.isArray(ticketTiers) ? (ticketTiers[0] ?? null) : ticketTiers,
    events: Array.isArray(events) ? (events[0] ?? null) : events,
    orders: Array.isArray(orders) ? (orders[0] ?? null) : orders,
  };
}

export function guestDisplayName(ticket: AdminGuestTicket): string {
  const profile = ticket.profiles;
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  const meta = ticket.metadata;
  if (meta?.holder_name?.trim()) return meta.holder_name.trim();
  const first = meta?.first_name?.trim() ?? '';
  const last = meta?.last_name?.trim() ?? '';
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  if (profile?.handle?.trim()) return profile.handle.trim();
  return 'Unknown';
}

export function guestEmail(ticket: AdminGuestTicket): string {
  const profile = ticket.profiles;
  if (profile?.handle?.includes('@')) return profile.handle;
  const meta = ticket.metadata;
  if (meta?.holder_email?.trim()) return meta.holder_email.trim();
  if (meta?.email?.trim()) return meta.email.trim();
  if (profile?.handle?.trim()) return profile.handle.trim();
  return '—';
}

export function guestAvatarUrl(ticket: AdminGuestTicket): string | null {
  return ticket.profiles?.avatar_url ?? null;
}

export function guestTierLabel(ticket: AdminGuestTicket): string {
  return ticket.ticket_tiers?.display_name ?? ticket.ticket_tiers?.name ?? 'General';
}

export function formatPurchasedAt(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

import { formatCents } from '@/lib/formatters';

export { formatCents };

export type TicketReceipt = {
  kind: 'order' | 'door' | 'single';
  subtotal: number;
  discount: number;
  fees: number;
  total: number;
  ticketCount: number;
  payMethod: string | null;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
};

export function receiptForTicket(
  ticket: AdminGuestTicket,
  allTickets: AdminGuestTicket[],
): TicketReceipt {
  const order = ticket.orders;
  if (order) {
    const isDoorOrder = order.stripe_payment_intent_id.startsWith('door_sale_');
    const metaPay = (ticket.metadata?.pay_method as string | undefined)?.trim();
    const payFromCharge =
      ticket.stripe_charge_id?.startsWith('door-')
        ? ticket.stripe_charge_id.replace(/^door-/, '').split('-')[0]
        : null;
    return {
      kind: isDoorOrder ? 'door' : 'order',
      subtotal: order.subtotal_cents,
      discount: order.discount_cents,
      fees: order.fee_cents,
      total: order.total_cents,
      ticketCount: allTickets.filter((t) => t.order_id === order.id).length,
      payMethod: isDoorOrder
        ? (metaPay || payFromCharge || 'Door')
        : 'Stripe',
      stripePaymentIntentId: isDoorOrder ? null : order.stripe_payment_intent_id,
      stripeChargeId: ticket.stripe_charge_id,
    };
  }

  const payMethod =
    (ticket.metadata?.pay_method as string | undefined)?.trim() ||
    (ticket.stripe_charge_id?.startsWith('door-')
      ? ticket.stripe_charge_id.replace(/^door-/, '').split('-')[0]
      : null) ||
    (ticket.source === 'door' ? 'Door' : null);

  return {
    kind: ticket.source === 'door' ? 'door' : 'single',
    subtotal: ticket.amount_cents,
    discount: 0,
    fees: ticket.fee_cents,
    total: ticket.amount_cents + ticket.fee_cents,
    ticketCount: 1,
    payMethod,
    stripePaymentIntentId: null,
    stripeChargeId: ticket.stripe_charge_id,
  };
}

export function receiptText(ticket: AdminGuestTicket, receipt: TicketReceipt): string {
  const ev = ticket.events;
  const lines = [
    'HOUSE OF FIRE — TICKET RECEIPT',
    '================================',
    `Event: ${ev ? `${ev.name} · Edition ${ev.edition_number}` : '—'}`,
    `Ticket code: ${ticket.code}`,
    `Guest: ${guestDisplayName(ticket)}`,
    `Email: ${guestEmail(ticket)}`,
    `Tier: ${guestTierLabel(ticket)}`,
    `Status: ${ticket.status}`,
    `Purchased: ${formatPurchasedAt(ticket.purchased_at)}`,
    '',
    'Payment',
    `Subtotal: ${formatCents(receipt.subtotal)}`,
  ];
  if (receipt.discount > 0) lines.push(`Discount: -${formatCents(receipt.discount)}`);
  lines.push(
    `Fees: ${formatCents(receipt.fees)}`,
    `Total: ${formatCents(receipt.total)}`,
    `Tickets in order: ${receipt.ticketCount}`,
  );
  if (receipt.payMethod) lines.push(`Payment method: ${receipt.payMethod}`);
  if (receipt.stripePaymentIntentId) {
    lines.push(`Stripe Payment Intent: ${receipt.stripePaymentIntentId}`);
  }
  if (receipt.stripeChargeId) lines.push(`Charge ID: ${receipt.stripeChargeId}`);
  return lines.join('\n');
}

export function groupTicketsByEvent(
  tickets: AdminGuestTicket[],
): Array<{ event: NonNullable<AdminGuestEvent>; tickets: AdminGuestTicket[] }> {
  const map = new Map<string, { event: NonNullable<AdminGuestEvent>; tickets: AdminGuestTicket[] }>();
  for (const t of tickets) {
    if (!t.events) continue;
    const existing = map.get(t.events.id);
    if (existing) {
      existing.tickets.push(t);
    } else {
      map.set(t.events.id, { event: t.events, tickets: [t] });
    }
  }
  return [...map.values()].sort((a, b) => b.event.edition_number - a.event.edition_number);
}

export function ticketMatchesEmail(ticket: AdminGuestTicket, emailQuery: string): boolean {
  const q = emailQuery.trim().toLowerCase();
  if (!q) return true;
  const email = guestEmail(ticket).toLowerCase();
  return email.includes(q);
}

export type GuestTierOption = {
  id: string;
  label: string;
  tierIds: string[];
};

/** Collapse duplicate tier labels across events (All editions view). */
export function tierOptionsFromTickets(tickets: AdminGuestTicket[]): GuestTierOption[] {
  const byLabel = new Map<string, { label: string; tierIds: string[] }>();

  for (const ticket of tickets) {
    const tier = ticket.ticket_tiers;
    if (!tier?.id) continue;
    const label = (tier.display_name || tier.name).trim();
    if (!label) continue;

    const key = label.toLowerCase();
    const existing = byLabel.get(key);
    if (existing) {
      if (!existing.tierIds.includes(tier.id)) existing.tierIds.push(tier.id);
      continue;
    }
    byLabel.set(key, { label, tierIds: [tier.id] });
  }

  return [...byLabel.values()]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(({ label, tierIds }) => ({
      id: tierIds.length === 1 ? tierIds[0]! : `group:${label.toLowerCase()}`,
      label,
      tierIds,
    }));
}

export function tierOptionsFromEventTiers(
  tiers: Array<{ id: string; display_name: string; name: string }>,
): GuestTierOption[] {
  return tiers.map((t) => ({
    id: t.id,
    label: t.display_name || t.name,
    tierIds: [t.id],
  }));
}

export function ticketMatchesTierFilter(
  ticket: AdminGuestTicket,
  tierId: string,
  options: GuestTierOption[],
): boolean {
  if (!tierId) return true;
  const option = options.find((o) => o.id === tierId);
  const tierIds = option?.tierIds ?? [tierId];
  return tierIds.includes(ticket.tier_id);
}
