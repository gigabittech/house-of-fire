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

/**
 * Read the target environment name from CLI args: `--env staging` or `--env=staging`.
 * Returns undefined when no flag is passed (default/production behavior).
 */
export function envNameFromArgv(argv = process.argv) {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--env') return argv[i + 1] || undefined;
    if (arg?.startsWith('--env=')) return arg.slice('--env='.length) || undefined;
  }
  return undefined;
}

/**
 * Load env from repo root `.env`, `.env.local`, and legacy `apps/mobile/.env.local` (later files win).
 * When an env name is given (or `--env <name>` is on the CLI), `.env.<name>` and
 * `.env.<name>.local` are loaded last so they override the base files.
 */
export function loadProjectEnv(envName = envNameFromArgv()) {
  const paths = [
    path.join(repoRoot, '.env'),
    path.join(repoRoot, '.env.local'),
    path.join(repoRoot, 'apps/mobile/.env.local'),
  ];
  if (envName) {
    paths.push(path.join(repoRoot, `.env.${envName}`), path.join(repoRoot, `.env.${envName}.local`));
  }
  const env = paths.reduce((acc, p) => ({ ...acc, ...parseEnvFile(p) }), {});
  if (envName) {
    if (!fs.existsSync(path.join(repoRoot, `.env.${envName}`))) {
      console.warn(`Warning: --env ${envName} given but .env.${envName} not found at repo root.`);
    } else {
      console.log(`Loaded environment overrides from .env.${envName}`);
    }
  }
  return env;
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
