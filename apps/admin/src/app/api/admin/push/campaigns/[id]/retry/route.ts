import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isVapidConfigured } from '@hof/push';
import { deliverPushCampaign } from '@/lib/pushCampaign.server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  if (!isVapidConfigured()) {
    return NextResponse.json({ error: 'VAPID keys are not configured.' }, { status: 503 });
  }

  const { id } = await ctx.params;
  const campaignId = id?.trim();
  if (!campaignId) {
    return NextResponse.json({ error: 'Campaign id is required' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  try {
    const delivery = await deliverPushCampaign(supabase, campaignId, { retryFailedOnly: true });
    const { data: campaign } = await supabase
      .from('push_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    return NextResponse.json({ campaign, delivery });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
