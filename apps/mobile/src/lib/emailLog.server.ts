import type { Json } from './database.types';
import { createServiceRoleClient } from './supabase.server';

export type EmailLogStatus = 'queued' | 'sent' | 'failed';

export type CreateEmailLogParams = {
  app: 'mobile';
  kind?: string | null;
  projectId?: string | null;
  toAddress: string;
  subject: string;
  textBody?: string | null;
  htmlBody?: string | null;
  fromEmail?: string | null;
  replyTo?: string | null;
  provider?: string;
  providerMessageId?: string | null;
  status: EmailLogStatus;
  errorMessage?: string | null;
  sentAt?: Date | null;
  meta?: Json | null;
};

export async function createEmailLog(params: CreateEmailLogParams): Promise<string> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from('email_logs')
    .insert({
      app: params.app,
      kind: params.kind ?? null,
      project_id: params.projectId ?? null,
      to_address: params.toAddress,
      subject: params.subject,
      text_body: params.textBody ?? null,
      html_body: params.htmlBody ?? null,
      from_email: params.fromEmail ?? null,
      reply_to: params.replyTo ?? null,
      provider: params.provider ?? 'resend',
      provider_message_id: params.providerMessageId ?? null,
      status: params.status,
      error_message: params.errorMessage ?? null,
      sent_at: params.sentAt ? params.sentAt.toISOString() : null,
      meta: params.meta ?? null,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? 'Failed to create email log');
  }
  return data.id;
}

export async function updateEmailLog(
  id: string,
  updates: {
    status?: EmailLogStatus;
    providerMessageId?: string | null;
    errorMessage?: string | null;
    sentAt?: Date | null;
  },
): Promise<void> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase
    .from('email_logs')
    .update({
      ...(updates.status ? { status: updates.status } : {}),
      ...(updates.providerMessageId !== undefined
        ? { provider_message_id: updates.providerMessageId }
        : {}),
      ...(updates.errorMessage !== undefined ? { error_message: updates.errorMessage } : {}),
      ...(updates.sentAt !== undefined
        ? { sent_at: updates.sentAt ? updates.sentAt.toISOString() : null }
        : {}),
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

