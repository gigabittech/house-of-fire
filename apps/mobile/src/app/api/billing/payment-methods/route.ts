import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ methods: [], error: 'Billing not configured' });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customerId =
    (user.user_metadata?.stripe_customer_id as string | undefined) ??
    (user.app_metadata?.stripe_customer_id as string | undefined);
  if (!customerId) {
    return NextResponse.json({ methods: [] });
  }

  const methods = await getStripe().paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  return NextResponse.json({
    methods: methods.data.map((m) => ({
      id: m.id,
      brand: m.card?.brand ?? 'card',
      last4: m.card?.last4 ?? '****',
      exp_month: m.card?.exp_month,
      exp_year: m.card?.exp_year,
    })),
  });
}
