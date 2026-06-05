#!/usr/bin/env node
/**
 * Set Site URL and redirect allow list on hosted Supabase Auth.
 *
 * Requires:
 *   - NEXT_PUBLIC_APP_URL (production member app URL)
 *   - SUPABASE_ACCESS_TOKEN
 *   - NEXT_PUBLIC_SUPABASE_URL (to derive project ref)
 *
 * Optional:
 *   - SUPABASE_AUTH_REDIRECT_URLS — comma-separated extra redirect URLs
 *     (defaults include production callbacks + localhost for local dev)
 *
 * Usage: pnpm configure:auth-urls
 */
import { loadProjectEnv, projectRefFromSupabaseUrl } from './load-mobile-env.mjs';

const env = { ...loadProjectEnv(), ...process.env };

const APP_URL = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
const SUPABASE_ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF =
  env.SUPABASE_PROJECT_REF ?? projectRefFromSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing ${name}.`);
    return false;
  }
  return true;
}

function defaultRedirectUrls(appUrl) {
  const urls = [
    `${appUrl}/auth/callback/client`,
    `${appUrl}/auth/callback`,
    'http://localhost:3000/auth/callback/client',
    'http://localhost:3000/auth/callback',
  ];
  return [...new Set(urls)];
}

function parseRedirectUrls(appUrl) {
  const raw = env.SUPABASE_AUTH_REDIRECT_URLS?.trim();
  if (!raw) return defaultRedirectUrls(appUrl);

  const fromEnv = raw
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  const urls = [
    `${appUrl}/auth/callback/client`,
    `${appUrl}/auth/callback`,
    ...fromEnv,
  ];
  return [...new Set(urls)];
}

if (
  !requireEnv('NEXT_PUBLIC_APP_URL', APP_URL) ||
  !requireEnv('SUPABASE_ACCESS_TOKEN', SUPABASE_ACCESS_TOKEN) ||
  !requireEnv('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_PROJECT_REF', PROJECT_REF)
) {
  console.error(`
Add to .env.local (or repo root .env):

  NEXT_PUBLIC_APP_URL=https://app.houseoffire.events
  SUPABASE_ACCESS_TOKEN=sbp_...   # https://supabase.com/dashboard/account/tokens
  NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co

Optional:
  SUPABASE_AUTH_REDIRECT_URLS=http://localhost:3000/auth/callback/client,http://localhost:3000/auth/callback

Then run: pnpm configure:auth-urls
`);
  process.exit(1);
}

const uriAllowList = parseRedirectUrls(APP_URL);
// Management API expects a comma-separated string, not a JSON array.
const body = {
  site_url: APP_URL,
  uri_allow_list: uriAllowList.join(','),
};

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

console.log(`Configuring Supabase Auth URLs for project ${PROJECT_REF}…`);
console.log(`  site_url: ${APP_URL}`);
console.log('  uri_allow_list:');
for (const entry of uriAllowList) {
  console.log(`    - ${entry}`);
}

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

console.log('Auth URL configuration updated successfully.');
console.log('Verify with: pnpm verify:auth-urls');
