import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { buildTicketQRData } from './qr';

type Supabase = SupabaseClient<Database>;
type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];

const MAX_QTY = 4;

export type DoorSaleInput = {
  tier_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  qty: number;
  pay_method: 'cash' | 'card' | 'tap';
  client_sale_id?: string;
};

export type DoorSaleTicket = {
  id: string;
  code: string;
  qr_data: string;
};

export type FulfillDoorSaleResult =
  | {
      ok: true;
      orderId: string;
      holderId: string;
      tickets: DoorSaleTicket[];
      qty: number;
      pay_method: string;
      holderName: string;
      tierName: string;
      subtotalCents: number;
      feeCents: number;
      totalCents: number;
      purchasedAt: string;
      alreadyFulfilled: boolean;
    }
  | { ok: false; error: string; code?: string; status: number };

function generateTicketCode(edition: number, n: number): string {
  return `HOF-${String(edition).padStart(2, '0')}-${String(n).padStart(4, '0')}`;
}

function doorPaymentIntentId(clientSaleId?: string): string {
  if (clientSaleId?.trim()) {
    return `door_sale_client_${clientSaleId.trim()}`;
  }
  return `door_sale_${randomUUID()}`;
}

async function getTierAvailableCount(
  supabase: Supabase,
  tierId: string,
): Promise<{ available: number } | { error: string }> {
  const { data, error } = await supabase.rpc(
    'tier_available_count' as never,
    { p_tier_id: tierId } as never,
  );

  if (error) {
    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('tier_id', tierId)
      .in('status', ['valid', 'used']);

    const { data: tier } = await supabase
      .from('ticket_tiers')
      .select('capacity')
      .eq('id', tierId)
      .single();

    if (!tier) return { error: 'Could not check availability' };
    return { available: Math.max(0, tier.capacity - (count ?? 0)) };
  }

  const n = typeof data === 'number' ? data : Number(data);
  if (!Number.isFinite(n)) return { error: 'Could not check availability' };
  return { available: n };
}

async function resolveHolderId(
  supabase: Supabase,
  email: string,
  first_name: string,
  last_name: string,
): Promise<{ holderId: string } | { error: string }> {
  const displayName = `${first_name} ${last_name}`.trim();
  const handle =
    email
      .split('@')[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9_]/g, '') || 'guest';

  const admin = supabase.auth.admin;
  let existingUser: { id: string } | null = null;

  try {
    const byEmail = await admin.getUserByEmail(email);
    if (byEmail.data?.user) {
      existingUser = { id: byEmail.data.user.id };
    }
  } catch {
    let page = 1;
    while (page <= 10 && !existingUser) {
      const { data: listData } = await admin.listUsers({ page, perPage: 200 });
      const match = listData?.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      );
      if (match) {
        existingUser = { id: match.id };
        break;
      }
      if (!listData?.users.length || listData.users.length < 200) break;
      page++;
    }
  }

  if (existingUser) {
    await supabase.from('profiles').upsert({
      id: existingUser.id,
      handle,
      display_name: displayName,
      role: 'member',
    });
    return { holderId: existingUser.id };
  }

  const { data: newAuthUser, error: createError } = await admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { first_name, last_name },
  });

  if (createError || !newAuthUser.user) {
    return { error: createError?.message ?? 'Failed to create user' };
  }

  const holderId = newAuthUser.user.id;
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: holderId,
    handle,
    display_name: displayName,
    role: 'member',
  });

  if (profileError) {
    return { error: profileError.message };
  }

  return { holderId };
}

export async function fulfillDoorSale(
  supabase: Supabase,
  input: DoorSaleInput,
): Promise<FulfillDoorSaleResult> {
  const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(input.qty)));
  const first_name = input.first_name.trim();
  const last_name = input.last_name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();

  if (!first_name || !last_name || !email) {
    return { ok: false, error: 'First name, last name, and email are required', status: 400 };
  }

  const piId = doorPaymentIntentId(input.client_sale_id);

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('stripe_payment_intent_id', piId)
    .maybeSingle();

  if (existingOrder) {
    const { data: orderRow } = await supabase
      .from('orders')
      .select('subtotal_cents, fee_cents, total_cents, created_at')
      .eq('id', existingOrder.id)
      .single();

    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('id, code, qr_data, purchased_at, amount_cents, fee_cents')
      .eq('order_id', existingOrder.id)
      .order('code', { ascending: true });

    const { data: tier } = await supabase
      .from('ticket_tiers')
      .select('display_name, name')
      .eq('id', input.tier_id)
      .maybeSingle();

    const firstTicket = existingTickets?.[0];

    return {
      ok: true,
      orderId: existingOrder.id,
      holderId: existingOrder.user_id,
      tickets: (existingTickets ?? []).map((t) => ({
        id: t.id,
        code: t.code,
        qr_data: t.qr_data,
      })),
      qty: existingTickets?.length ?? qty,
      pay_method: input.pay_method,
      holderName: `${first_name} ${last_name}`,
      tierName: tier?.display_name ?? tier?.name ?? 'Ticket',
      subtotalCents: orderRow?.subtotal_cents ?? firstTicket?.amount_cents ?? 0,
      feeCents: orderRow?.fee_cents ?? firstTicket?.fee_cents ?? 0,
      totalCents: orderRow?.total_cents ?? 0,
      purchasedAt: firstTicket?.purchased_at ?? orderRow?.created_at ?? new Date().toISOString(),
      alreadyFulfilled: true,
    };
  }

  const { data: tier, error: tierError } = await supabase
    .from('ticket_tiers')
    .select('id, event_id, price_cents, fee_cents, capacity, name, display_name, status')
    .eq('id', input.tier_id)
    .single();

  if (tierError || !tier) {
    return { ok: false, error: 'Ticket tier not found', status: 404 };
  }

  if (tier.status === 'hidden' || tier.status === 'sold_out') {
    return {
      ok: false,
      error: 'This tier is not available for sale',
      code: 'sold_out',
      status: 409,
    };
  }

  const availability = await getTierAvailableCount(supabase, tier.id);
  if ('error' in availability) {
    return { ok: false, error: availability.error, status: 500 };
  }

  if (availability.available <= 0) {
    return {
      ok: false,
      error: 'This tier is sold out',
      code: 'sold_out',
      status: 409,
    };
  }

  if (availability.available < qty) {
    return {
      ok: false,
      error: `Only ${availability.available} ticket(s) left for this tier`,
      code: 'capacity_exceeded',
      status: 409,
    };
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, edition_number, capacity')
    .eq('id', tier.event_id)
    .single();

  if (eventError || !event) {
    return { ok: false, error: 'Event not found', status: 404 };
  }

  const { count: eventSold } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .in('status', ['valid', 'used']);

  const eventRemaining = Math.max(0, event.capacity - (eventSold ?? 0));
  if (eventRemaining < qty) {
    return {
      ok: false,
      error: `Only ${eventRemaining} ticket(s) left for this event`,
      code: 'capacity_exceeded',
      status: 409,
    };
  }

  const holderResult = await resolveHolderId(supabase, email, first_name, last_name);
  if ('error' in holderResult) {
    return { ok: false, error: holderResult.error, status: 500 };
  }

  const subtotalCents = tier.price_cents * qty;
  const feeCentsTotal = (tier.fee_cents ?? 0) * qty;
  const totalCents = subtotalCents + feeCentsTotal;
  const now = new Date().toISOString();
  const orderInsert: OrderInsert = {
    user_id: holderResult.holderId,
    event_id: tier.event_id,
    tier_id: tier.id,
    quantity: qty,
    subtotal_cents: subtotalCents,
    discount_cents: 0,
    fee_cents: feeCentsTotal,
    total_cents: totalCents,
    stripe_payment_intent_id: piId,
    status: 'completed',
  };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderInsert)
    .select('id')
    .single();

  if (orderError) {
    if (orderError.code === '23505' && input.client_sale_id) {
      const { data: raced } = await supabase
        .from('orders')
        .select('id, user_id')
        .eq('stripe_payment_intent_id', piId)
        .maybeSingle();
      if (raced) {
        const { data: racedTickets } = await supabase
          .from('tickets')
          .select('id, code, qr_data')
          .eq('order_id', raced.id)
          .order('code', { ascending: true });
        return {
          ok: true,
          orderId: raced.id,
          holderId: raced.user_id,
          tickets: (racedTickets ?? []).map((t) => ({
            id: t.id,
            code: t.code,
            qr_data: t.qr_data,
          })),
          qty: racedTickets?.length ?? qty,
          pay_method: input.pay_method,
          holderName: `${first_name} ${last_name}`,
          tierName: tier.display_name ?? tier.name,
          subtotalCents,
          feeCents: feeCentsTotal,
          totalCents,
          purchasedAt: now,
          alreadyFulfilled: true,
        };
      }
    }
    return { ok: false, error: orderError.message, status: 500 };
  }

  const { count: ticketCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', tier.event_id);

  const startN = (ticketCount ?? 0) + 1;
  const chargeId = `door-${input.pay_method}-${order.id}`;
  const metadata = {
    first_name,
    last_name,
    email,
    phone: phone || null,
    pay_method: input.pay_method,
  };

  const ticketRows: TicketInsert[] = [];
  for (let i = 0; i < qty; i++) {
    const code = generateTicketCode(event.edition_number, startN + i);
    ticketRows.push({
      code,
      event_id: tier.event_id,
      tier_id: tier.id,
      holder_id: holderResult.holderId,
      order_id: order.id,
      amount_cents: tier.price_cents,
      fee_cents: tier.fee_cents ?? 0,
      status: 'valid',
      purchased_at: now,
      source: 'door',
      metadata,
      qr_data: buildTicketQRData(code, tier.event_id),
      stripe_payment_intent_id: null,
      stripe_charge_id: chargeId,
    });
  }

  const { data: inserted, error: ticketError } = await supabase
    .from('tickets')
    .insert(ticketRows)
    .select('id, code, qr_data');

  if (ticketError) {
    await supabase.from('orders').delete().eq('id', order.id);
    return { ok: false, error: ticketError.message, status: 500 };
  }

  console.log(
    `[door-sale] order=${order.id} email=${email} codes=${(inserted ?? []).map((t) => t.code).join(', ')}`,
  );

  return {
    ok: true,
    orderId: order.id,
    holderId: holderResult.holderId,
    tickets: (inserted ?? []).map((t) => ({
      id: t.id,
      code: t.code,
      qr_data: t.qr_data,
    })),
    qty,
    pay_method: input.pay_method,
    holderName: `${first_name} ${last_name}`,
    tierName: tier.display_name ?? tier.name,
    subtotalCents,
    feeCents: feeCentsTotal,
    totalCents,
    purchasedAt: now,
    alreadyFulfilled: false,
  };
}
