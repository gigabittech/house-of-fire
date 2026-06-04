import { type NextRequest, NextResponse } from 'next/server';
import { loadReceiptData } from '@/lib/receipt/loadReceiptData';
import { createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const receipt = await loadReceiptData(orderId);
  if (!receipt) {
    return NextResponse.json({ error: 'Receipt not available' }, { status: 404 });
  }

  return NextResponse.json({ receipt });
}
