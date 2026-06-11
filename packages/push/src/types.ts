export type PushSegment = 'all_members' | 'event_attendees' | 'vip_members';

export type PushCampaignStatus = 'queued' | 'sending' | 'completed' | 'partial' | 'failed';

export type PushDeliveryStatus = 'pending' | 'sent' | 'failed' | 'expired';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushSendResult {
  ok: boolean;
  statusCode?: number;
  expired: boolean;
  errorMessage?: string;
  retryable: boolean;
}

export interface PushRecipientRow {
  subscription_id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
}
