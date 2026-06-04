export interface SendEmailAttachment {
  filename: string;
  /** Base64-encoded file content (Resend API). */
  content: string;
}

export interface SendEmailParams {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: SendEmailAttachment[];
}

export interface SendEmailResult {
  id: string;
}

const DEFAULT_FROM =
  process.env.RESEND_FROM_EMAIL ?? 'House of Fire <tickets@houseoffire.club>';

async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    const msg =
      '[resend] RESEND_API_KEY is not set — email was not sent. Add it to the monorepo root .env.local';
    console.error(msg);
    throw new Error(msg);
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from ?? DEFAULT_FROM,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      ...(params.text ? { text: params.text } : {}),
      ...(params.attachments?.length ? { attachments: params.attachments } : {}),
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '(no body)');
    throw new Error(`Resend API error ${response.status}: ${errBody}`);
  }

  const data = (await response.json()) as { id: string };
  return { id: data.id };
}

export const resend = {
  emails: {
    send: sendEmail,
  },
};
