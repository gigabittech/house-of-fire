import type { PushPayload, PushRecipientRow, PushSegment } from '@hof/push';
import { sendWebPush } from '@hof/push/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type AdminClient = SupabaseClient<Database>;

const BATCH_SIZE = 100;

export interface CreatePushCampaignInput {
  title: string;
  body: string;
  url?: string | null;
  segment: PushSegment;
  eventId?: string | null;
  createdBy: string;
  meta?: Record<string, unknown>;
}

export async function countSegmentRecipients(
  supabase: AdminClient,
  segment: PushSegment,
  eventId?: string | null,
): Promise<number> {
  const { data, error } = await supabase.rpc('count_push_recipients', {
    p_segment: segment,
    p_event_id: eventId ?? undefined,
  });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

export async function createPushCampaign(
  supabase: AdminClient,
  input: CreatePushCampaignInput,
): Promise<{ id: string; targetCount: number }> {
  const targetCount = await countSegmentRecipients(supabase, input.segment, input.eventId);

  const { data, error } = await supabase
    .from('push_campaigns')
    .insert({
      created_by: input.createdBy,
      title: input.title,
      body: input.body,
      url: input.url ?? null,
      segment: input.segment,
      event_id: input.eventId ?? null,
      status: 'queued',
      target_count: targetCount,
      meta: input.meta ?? {},
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create push campaign');
  }

  return { id: data.id, targetCount };
}

async function listRecipientBatch(
  supabase: AdminClient,
  segment: PushSegment,
  eventId: string | null,
  cursorId: string | null,
): Promise<PushRecipientRow[]> {
  const { data, error } = await supabase.rpc('list_push_recipients', {
    p_segment: segment,
    p_event_id: eventId ?? undefined,
    p_cursor_id: cursorId ?? undefined,
    p_limit: BATCH_SIZE,
  });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    subscription_id: row.subscription_id,
    user_id: row.user_id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth_key: row.auth_key,
  }));
}

async function recordDelivery(
  supabase: AdminClient,
  params: {
    campaignId: string;
    recipient: PushRecipientRow;
    status: 'sent' | 'failed' | 'expired';
    errorMessage?: string;
    attemptCount: number;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await supabase.from('push_deliveries').upsert(
    {
      campaign_id: params.campaignId,
      subscription_id: params.recipient.subscription_id,
      user_id: params.recipient.user_id,
      status: params.status,
      error_message: params.errorMessage ?? null,
      attempt_count: params.attemptCount,
      sent_at: params.status === 'sent' ? now : null,
      updated_at: now,
    },
    { onConflict: 'campaign_id,subscription_id' },
  );
}

export async function deliverPushCampaign(
  supabase: AdminClient,
  campaignId: string,
  options?: { retryFailedOnly?: boolean },
): Promise<{
  sent: number;
  failed: number;
  expired: number;
  processed: number;
}> {
  const { data: campaign, error: campaignError } = await supabase
    .from('push_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error(campaignError?.message ?? 'Campaign not found');
  }

  await supabase
    .from('push_campaigns')
    .update({ status: 'sending', updated_at: new Date().toISOString() })
    .eq('id', campaignId);

  const payload: PushPayload = {
    title: campaign.title,
    body: campaign.body,
    url: campaign.url ?? '/',
    tag: `campaign-${campaignId}`,
  };

  let sent = 0;
  let failed = 0;
  let expired = 0;
  let processed = 0;
  let cursorId: string | null = null;

  if (options?.retryFailedOnly) {
    const { data: failedRows, error: failedError } = await supabase
      .from('push_deliveries')
      .select('subscription_id, user_id, attempt_count')
      .eq('campaign_id', campaignId)
      .in('status', ['failed', 'pending'])
      .limit(BATCH_SIZE);

    if (failedError) throw new Error(failedError.message);

    const subscriptionIds = (failedRows ?? []).map((r) => r.subscription_id);
    if (subscriptionIds.length) {
      const { data: subs, error: subsError } = await supabase
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh, auth_key')
        .in('id', subscriptionIds);

      if (subsError) throw new Error(subsError.message);

      const attemptBySub = new Map(
        (failedRows ?? []).map((r) => [r.subscription_id, (r.attempt_count ?? 0) + 1]),
      );

      for (const sub of subs ?? []) {
        const recipient: PushRecipientRow = {
          subscription_id: sub.id,
          user_id: sub.user_id,
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth_key: sub.auth_key,
        };
        const attemptCount = attemptBySub.get(sub.id) ?? 1;

        const result = await sendWebPush(
          { endpoint: recipient.endpoint, p256dh: recipient.p256dh, auth: recipient.auth_key },
          payload,
        );
        processed += 1;

        if (result.ok) {
          sent += 1;
          await recordDelivery(supabase, {
            campaignId,
            recipient,
            status: 'sent',
            attemptCount,
          });
        } else if (result.expired) {
          expired += 1;
          await supabase.from('push_subscriptions').delete().eq('id', recipient.subscription_id);
          await recordDelivery(supabase, {
            campaignId,
            recipient,
            status: 'expired',
            errorMessage: result.errorMessage,
            attemptCount,
          });
        } else {
          failed += 1;
          await recordDelivery(supabase, {
            campaignId,
            recipient,
            status: 'failed',
            errorMessage: result.errorMessage,
            attemptCount,
          });
        }
      }
    }
  } else {
    for (;;) {
      const batch = await listRecipientBatch(
        supabase,
        campaign.segment as PushSegment,
        campaign.event_id,
        cursorId,
      );
      if (!batch.length) break;

      for (const recipient of batch) {
        const result = await sendWebPush(
          { endpoint: recipient.endpoint, p256dh: recipient.p256dh, auth: recipient.auth_key },
          payload,
        );
        processed += 1;

        if (result.ok) {
          sent += 1;
          await recordDelivery(supabase, {
            campaignId,
            recipient,
            status: 'sent',
            attemptCount: 1,
          });
        } else if (result.expired) {
          expired += 1;
          await supabase.from('push_subscriptions').delete().eq('id', recipient.subscription_id);
          await recordDelivery(supabase, {
            campaignId,
            recipient,
            status: 'expired',
            errorMessage: result.errorMessage,
            attemptCount: 1,
          });
        } else {
          failed += 1;
          await recordDelivery(supabase, {
            campaignId,
            recipient,
            status: 'failed',
            errorMessage: result.errorMessage,
            attemptCount: 1,
          });
        }
      }

      const last = batch[batch.length - 1];
      if (!last || batch.length < BATCH_SIZE) break;
      cursorId = last.subscription_id;
    }
  }

  const nextSent = (campaign.sent_count ?? 0) + sent;
  const nextFailed = (campaign.failed_count ?? 0) + failed;
  const nextExpired = (campaign.expired_count ?? 0) + expired;
  const target = campaign.target_count ?? 0;
  const doneTotal = nextSent + nextFailed + nextExpired;

  let status: Database['public']['Tables']['push_campaigns']['Row']['status'] = 'completed';
  if (doneTotal === 0 && target === 0) status = 'completed';
  else if (nextFailed > 0 && nextSent > 0) status = 'partial';
  else if (nextFailed > 0 && nextSent === 0) status = 'failed';
  else if (doneTotal < target) status = 'partial';

  await supabase
    .from('push_campaigns')
    .update({
      status,
      sent_count: nextSent,
      failed_count: nextFailed,
      expired_count: nextExpired,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId);

  return { sent, failed, expired, processed };
}
