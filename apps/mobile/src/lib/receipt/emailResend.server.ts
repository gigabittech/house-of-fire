import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import { rateLimitCheck } from '../rateLimit';
import { sendOrderReceiptEmail } from './sendOrderReceiptEmail';

type ServiceClient = SupabaseClient<Database>;

export type ReceiptResendActorType = 'admin' | 'member' | 'system';

export type ReceiptResendSource =
  | 'admin_guests'
  | 'admin_email_log_retry'
  | 'member_tickets'
  | 'service_retry';

const MEMBER_ORDER_LIMIT = 3;
const MEMBER_ORDER_WINDOW_MS = 60 * 60 * 1000;
const ADMIN_ORDER_LIMIT = 10;
const ADMIN_ORDER_WINDOW_MS = 60 * 60 * 1000;
const MEMBER_IP_LIMIT = 20;
const MEMBER_IP_WINDOW_MS = 60 * 60 * 1000;

export class ReceiptResendRateLimitError extends Error {
  constructor() {
    super('Too many receipt resend requests. Please try again later.');
    this.name = 'ReceiptResendRateLimitError';
  }
}

export class ReceiptResendForbiddenError extends Error {
  constructor(message = 'You do not have permission to resend this receipt.') {
    super(message);
    this.name = 'ReceiptResendForbiddenError';
  }
}

export class ReceiptResendNotFoundError extends Error {
  constructor(message = 'Order not found.') {
    super(message);
    this.name = 'ReceiptResendNotFoundError';
  }
}

function assertResendRateLimit(
  actorType: ReceiptResendActorType,
  actorKey: string,
  orderId: string,
) {
  if (actorType === 'admin') {
    if (
      !rateLimitCheck(
        `receipt-resend:admin:${actorKey}:${orderId}`,
        ADMIN_ORDER_LIMIT,
        ADMIN_ORDER_WINDOW_MS,
      )
    ) {
      throw new ReceiptResendRateLimitError();
    }
    return;
  }

  if (
    !rateLimitCheck(
      `receipt-resend:member:${actorKey}:${orderId}`,
      MEMBER_ORDER_LIMIT,
      MEMBER_ORDER_WINDOW_MS,
    )
  ) {
    throw new ReceiptResendRateLimitError();
  }
  if (
    !rateLimitCheck(`receipt-resend:member-ip:${actorKey}`, MEMBER_IP_LIMIT, MEMBER_IP_WINDOW_MS)
  ) {
    throw new ReceiptResendRateLimitError();
  }
}

export async function logReceiptResendAudit(
  supabase: ServiceClient,
  params: {
    orderId: string;
    emailLogId?: string | null;
    actorId?: string | null;
    actorType: ReceiptResendActorType;
    recipient: string;
    source: ReceiptResendSource;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase.from('email_resend_audit').insert({
    order_id: params.orderId,
    email_log_id: params.emailLogId ?? null,
    actor_id: params.actorId ?? null,
    actor_type: params.actorType,
    recipient: params.recipient,
    source: params.source,
    meta: params.meta ?? {},
  });

  if (error) {
    console.error('[receipt-resend] Failed to write audit log:', error.message);
  }
}

async function loadOrderRecipient(orderId: string): Promise<string> {
  const { loadReceiptData } = await import('./loadReceiptData');
  const data = await loadReceiptData(orderId);
  const recipient = data?.buyer.email?.trim();
  if (!recipient) {
    throw new Error('No recipient email found for this order.');
  }
  return recipient;
}

export async function resendOrderReceipt(params: {
  supabase: ServiceClient;
  orderId: string;
  actorType: ReceiptResendActorType;
  actorId?: string | null;
  actorKey: string;
  source: ReceiptResendSource;
  existingLogId?: string;
  meta?: Record<string, unknown>;
}): Promise<{ recipient: string }> {
  const orderId = params.orderId.trim();
  if (!orderId) {
    throw new Error('orderId is required');
  }

  assertResendRateLimit(params.actorType, params.actorKey, orderId);

  const recipient = await loadOrderRecipient(orderId);

  await sendOrderReceiptEmail({ orderId, existingLogId: params.existingLogId });

  await logReceiptResendAudit(params.supabase, {
    orderId,
    emailLogId: params.existingLogId ?? null,
    actorId: params.actorId ?? null,
    actorType: params.actorType,
    recipient,
    source: params.source,
    meta: params.meta,
  });

  return { recipient };
}

export async function assertMemberOwnsOrder(
  supabase: ServiceClient,
  userId: string,
  orderId: string,
): Promise<void> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !order) {
    throw new ReceiptResendForbiddenError();
  }
}
