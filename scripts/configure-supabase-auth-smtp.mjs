#!/usr/bin/env node
/**
 * Configure Resend SMTP for Supabase Auth on a hosted project.
 *
 * Requires:
 *   - RESEND_API_KEY, RESEND_FROM_EMAIL (apps/mobile/.env.local)
 *   - SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)
 *   - NEXT_PUBLIC_SUPABASE_URL (to derive project ref)
 *
 * Usage: pnpm configure:auth-smtp
 */
import { loadProjectEnv, projectRefFromSupabaseUrl } from './load-mobile-env.mjs';

// File env first; process.env wins so CLI overrides work (e.g. RESEND_FROM_EMAIL=onboarding@resend.dev)
const env = { ...loadProjectEnv(), ...process.env };

const RESEND_API_KEY = env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL;
const SUPABASE_ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF =
  env.SUPABASE_PROJECT_REF ?? projectRefFromSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);

const SMTP_HOST = env.SUPABASE_SMTP_HOST ?? 'smtp.resend.com';
const SMTP_PORT = Number(env.SUPABASE_SMTP_PORT ?? '465');
const SMTP_USER = env.SUPABASE_SMTP_USER ?? 'resend';
const SMTP_SENDER_NAME = env.SUPABASE_SMTP_SENDER_NAME ?? 'House of Fire';

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing ${name}.`);
    return false;
  }
  return true;
}

if (
  !requireEnv('RESEND_API_KEY', RESEND_API_KEY) ||
  !requireEnv('RESEND_FROM_EMAIL', RESEND_FROM_EMAIL) ||
  !requireEnv('SUPABASE_ACCESS_TOKEN', SUPABASE_ACCESS_TOKEN) ||
  !requireEnv('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_PROJECT_REF', PROJECT_REF)
) {
  console.error(`
Add to apps/mobile/.env.local (or repo root .env):

  RESEND_API_KEY=re_...
  RESEND_FROM_EMAIL=you@your-verified-domain.com
  SUPABASE_ACCESS_TOKEN=sbp_...   # https://supabase.com/dashboard/account/tokens
  NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co

Then run: pnpm configure:auth-smtp
`);
  process.exit(1);
}

/** @returns {Promise<{ ok: boolean; message: string }>} */
async function verifyResendSender(fromEmail, apiKey) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `House of Fire <${fromEmail}>`,
      to: ['delivered@resend.dev'],
      subject: 'Resend sender verification (House of Fire)',
      html: '<p>Sender check — you can ignore this message.</p>',
    }),
  });
  if (response.ok) return { ok: true, message: 'Sender accepted by Resend.' };
  const err = await response.json().catch(() => ({}));
  const message = err.message ?? (await response.text());
  return { ok: false, message };
}

console.log(`Checking Resend accepts sender ${RESEND_FROM_EMAIL}…`);
const senderCheck = await verifyResendSender(RESEND_FROM_EMAIL, RESEND_API_KEY);
if (!senderCheck.ok) {
  console.error(`Resend rejected this sender: ${senderCheck.message}`);
  console.error(`
Fix options:
  1. Verify your domain at https://resend.com/domains (required for mahdi@gigabit.agency)
  2. For local dev only, use Resend's test sender:
       RESEND_FROM_EMAIL=onboarding@resend.dev pnpm configure:auth-smtp
`);
  process.exit(1);
}
console.log(senderCheck.message);

const body = {
  external_email_enabled: true,
  mailer_secure_email_change_enabled: true,
  mailer_autoconfirm: false,
  smtp_admin_email: RESEND_FROM_EMAIL,
  smtp_host: SMTP_HOST,
  smtp_port: String(SMTP_PORT),
  smtp_user: SMTP_USER,
  smtp_pass: RESEND_API_KEY,
  smtp_sender_name: SMTP_SENDER_NAME,
  // Seconds between auth emails to the same address (default is strict).
  smtp_max_frequency: Number(env.SUPABASE_SMTP_MAX_FREQUENCY ?? '60'),
  // Raise hosted auth email / OTP limits after custom SMTP (defaults are low).
  rate_limit_email_sent: Number(env.SUPABASE_RATE_LIMIT_EMAIL_SENT ?? '100'),
  rate_limit_otp: Number(env.SUPABASE_RATE_LIMIT_OTP ?? '100'),
};

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

console.log(`Configuring Supabase Auth SMTP for project ${PROJECT_REF}…`);
console.log(`  host: ${SMTP_HOST}:${SMTP_PORT}`);
console.log(`  from: ${RESEND_FROM_EMAIL} (${SMTP_SENDER_NAME})`);

const response = await fetch(url, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const text = await response.text();
if (!response.ok) {
  console.error(`Failed (${response.status}):`, text);
  process.exit(1);
}

console.log('SMTP configured successfully.');
console.log('Verify with: pnpm verify:auth-smtp');
console.log('Set Site URL + redirect URLs with: pnpm configure:auth-urls');
