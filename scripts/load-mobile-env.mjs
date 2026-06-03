import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/** @returns {Record<string, string>} */
export function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/** Load env from repo root `.env`, `.env.local`, and legacy `apps/mobile/.env.local` (later files win). */
export function loadProjectEnv() {
  const paths = [
    path.join(repoRoot, '.env'),
    path.join(repoRoot, '.env.local'),
    path.join(repoRoot, 'apps/mobile/.env.local'),
  ];
  return paths.reduce((acc, p) => ({ ...acc, ...parseEnvFile(p) }), {});
}

export function projectRefFromSupabaseUrl(url) {
  if (!url) return '';
  try {
    return new URL(url).hostname.split('.')[0] ?? '';
  } catch {
    return '';
  }
}

export { repoRoot };
