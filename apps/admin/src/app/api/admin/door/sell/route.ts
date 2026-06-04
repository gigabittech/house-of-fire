import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { fulfillDoorSale } from '@/lib/fulfillDoorSale';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

interface SellRequestBody {
  tier_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  qty: number;
  pay_method: 'cash' | 'card' | 'tap';
}

function isSellBody(v: unknown): v is SellRequestBody {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj['tier_id'] === 'string' &&
    typeof obj['first_name'] === 'string' &&
    typeof obj['last_name'] === 'string' &&
    typeof obj['email'] === 'string' &&
    (obj['phone'] === undefined || typeof obj['phone'] === 'string') &&
    typeof obj['qty'] === 'number' &&
    (obj['pay_method'] === 'cash' ||
      obj['pay_method'] === 'card' ||
      obj['pay_method'] === 'tap')
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isSellBody(body)) {
    return NextResponse.json(
      {
        error:
          'Missing required fields: tier_id, first_name, last_name, email, qty, pay_method',
      },
      { status: 400 },
    );
  }

  if (body.qty < 1 || body.qty > 10) {
    return NextResponse.json({ error: 'qty must be between 1 and 10' }, { status: 400 });
  }

  const clientSaleId = request.headers.get('x-client-sale-id')?.trim() || undefined;

  const supabase = createAdminSupabaseClient();
  const result = await fulfillDoorSale(supabase, {
    tier_id: body.tier_id,
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    phone: body.phone ?? '',
    qty: body.qty,
    pay_method: body.pay_method,
    client_sale_id: clientSaleId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status },
    );
  }

  return NextResponse.json({
    outcome: 'sold',
    qty: result.qty,
    pay_method: result.pay_method,
    holder_id: result.holderId,
    holder_name: result.holderName,
    tier_name: result.tierName,
    order_id: result.orderId,
    tickets: result.tickets,
    subtotal_cents: result.subtotalCents,
    fee_cents: result.feeCents,
    total_cents: result.totalCents,
    purchased_at: result.purchasedAt,
    already_fulfilled: result.alreadyFulfilled,
  });
}
