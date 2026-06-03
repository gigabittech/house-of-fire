#!/usr/bin/env node
/**
 * Verify hosted Supabase Auth Site URL and redirect allow list.
 *
 * Usage: pnpm verify:auth-urls
 */
import { loadProjectEnv, projectRefFromSupabaseUrl } from './load-mobile-env.mjs';

const env = { ...loadProjectEnv(), ...process.env };
const SUPABASE_ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF =
  env.SUPABASE_PROJECT_REF ?? projectRefFromSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);
const expectedAppUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');

if (!SUPABASE_ACCESS_TOKEN || !PROJECT_REF) {
  console.error('Need SUPABASE_ACCESS_TOKEN and NEXT_PUBLIC_SUPABASE_URL in .env.local');
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
const siteUrl = config.site_url ?? '';
const allowList = config.uri_allow_list ?? [];

console.log(`Project: ${PROJECT_REF}`);
console.log(`  site_url: ${siteUrl || '(not set)'}`);
console.log('  uri_allow_list:');
if (allowList.length === 0) {
  console.log('    (empty)');
} else {
  for (const entry of allowList) {
    console.log(`    - ${entry}`);
  }
}

const issues = [];
if (siteUrl.includes('localhost')) {
  issues.push('site_url still points at localhost — run pnpm configure:auth-urls with production NEXT_PUBLIC_APP_URL');
}
if (expectedAppUrl && siteUrl !== expectedAppUrl) {
  issues.push(`site_url is "${siteUrl}" but NEXT_PUBLIC_APP_URL is "${expectedAppUrl}"`);
}
if (expectedAppUrl) {
  for (const path of ['/auth/callback/client', '/auth/callback']) {
    const required = `${expectedAppUrl}${path}`;
    if (!allowList.includes(required)) {
      issues.push(`missing redirect URL: ${required}`);
    }
  }
}

if (issues.length > 0) {
  console.error('\nIssues:');
  for (const issue of issues) {
    console.error(`  - ${issue}`);
  }
  console.error('\nFix with: pnpm configure:auth-urls');
  process.exit(1);
}

console.log('\nAuth URL configuration looks correct.');
