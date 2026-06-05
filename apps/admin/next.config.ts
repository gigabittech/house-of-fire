import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import path from 'node:path';

const monorepoRoot = path.join(__dirname, '../..');
// Next.js loads app-dir env first; forceReload replaces it with monorepo root `.env.local`.
// https://github.com/vercel/next.js/issues/92040 — keep secrets in repo root, not apps/*/.
const isDev = process.env.NODE_ENV !== 'production';
loadEnvConfig(monorepoRoot, isDev, undefined, true);

const nextConfig: NextConfig = {
  // Next's forked "Running TypeScript" step OOMs on large generated types; use `pnpm typecheck`.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Monorepo root: Turbopack + output tracing must match (see .npmrc next hoisting).
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,

  // Workspace packages ship built ESM; transpile them through Next for safety.
  transpilePackages: ['@hof/ui', '@hof/design-tokens'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
