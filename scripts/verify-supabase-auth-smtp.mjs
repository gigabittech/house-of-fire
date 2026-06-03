#!/usr/bin/env node
/**
 * Verify hosted Supabase Auth is using custom SMTP (not built-in).
 *
 * Usage: pnpm verify:auth-smtp
 */
import { loadProjectEnv, projectRefFromSupabaseUrl } from './load-mobile-env.mjs';

const env = { ...loadProjectEnv(), ...process.env };
const SUPABASE_ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF =
  env.SUPABASE_PROJECT_REF ?? projectRefFromSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);

if (!SUPABASE_ACCESS_TOKEN || !PROJECT_REF) {
  console.error('Need SUPABASE_ACCESS_TOKEN and NEXT_PUBLIC_SUPABASE_URL in apps/mobile/.env.local');
  process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}` },
});

const text = await response.text();
if (!response.ok) {
  console.error(`Failed (${response.status}):`, text);
  process.exit(1);
}

const config = JSON.parse(text);
const host = config.smtp_host ?? '';
const from = config.smtp_admin_email ?? '';
const external = config.external_email_enabled;

console.log(`Project: ${PROJECT_REF}`);
console.log(`  external_email_enabled: ${external}`);
console.log(`  smtp_host: ${host || '(not set — using built-in email)'}`);
console.log(`  smtp_admin_email: ${from || '(not set)'}`);
console.log(`  smtp_sender_name: ${config.smtp_sender_name ?? ''}`);
console.log(`  smtp_max_frequency: ${config.smtp_max_frequency ?? ''}`);
console.log(`  rate_limit_email_sent: ${config.rate_limit_email_sent ?? ''}`);
console.log(`  rate_limit_otp: ${config.rate_limit_otp ?? ''}`);

const ok = Boolean(host && host !== 'supabase.io' && from);
if (ok) {
  console.log('\nCustom SMTP appears configured. Magic-link emails should use Resend.');
  process.exit(0);
}

console.error('\nCustom SMTP is NOT configured. Run: pnpm configure:auth-smtp');
process.exit(1);
