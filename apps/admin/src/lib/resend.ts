export interface SendEmailParams {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  log?: {
    existingLogId?: string;
    projectId?: string;
    kind?: string;
    meta?: Record<string, unknown>;
  };
}

export interface SendEmailResult {
  id: string;
}

async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { log, ...email } = params;
  const { createEmailLog, updateEmailLog } = await import('./emailLog.server');
  const toAddress = Array.isArray(email.to) ? email.to.join(', ') : email.to;

  let logId = log?.existingLogId;
  if (!logId) {
    try {
      logId = await createEmailLog({
        app: 'admin',
        kind: log?.kind ?? null,
        projectId: log?.projectId ?? null,
        toAddress,
        subject: email.subject,
        textBody: email.text ?? null,
        htmlBody: email.html ?? null,
        fromEmail:
          email.from ?? process.env.RESEND_FROM_EMAIL ?? 'House of Fire <tickets@houseoffire.club>',
        status: 'queued',
        meta: (log?.meta ?? null) as any,
      });
    } catch (err) {
      console.error('[email_log] create failed (continuing send):', err);
    }
  } else {
    try {
      await updateEmailLog(logId, { status: 'queued', errorMessage: null, sentAt: null });
    } catch (err) {
      console.error('[email_log] update queued failed (continuing send):', err);
    }
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    const id = `mock_${Date.now()}`;
    console.warn('[resend] RESEND_API_KEY is not set — skipping real send, returning mock id');
    if (logId) {
      try {
        await updateEmailLog(logId, {
          status: 'failed',
          providerMessageId: id,
          errorMessage: '[resend] RESEND_API_KEY is not set — email was not sent.',
        });
      } catch (err) {
        console.error('[email_log] mark failed failed:', err);
      }
    }
    return { id };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:
        email.from ?? process.env.RESEND_FROM_EMAIL ?? 'House of Fire <tickets@houseoffire.club>',
      to: Array.isArray(email.to) ? email.to : [email.to],
      subject: email.subject,
      html: email.html,
      ...(email.text ? { text: email.text } : {}),
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '(no body)');
    const message = `Resend API error ${response.status}: ${errBody}`;
    if (logId) {
      try {
        await updateEmailLog(logId, { status: 'failed', errorMessage: message });
      } catch (err) {
        console.error('[email_log] mark failed failed:', err);
      }
    }
    throw new Error(message);
  }

  const data = (await response.json()) as { id: string };
  if (logId) {
    try {
      await updateEmailLog(logId, {
        status: 'sent',
        providerMessageId: data.id,
        errorMessage: null,
        sentAt: new Date(),
      });
    } catch (err) {
      console.error('[email_log] mark sent failed:', err);
    }
  }
  return { id: data.id };
}

export const resend = {
  emails: {
    send: sendEmail,
  },
};
