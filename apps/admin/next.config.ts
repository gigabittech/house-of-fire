import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import path from 'node:path';

const monorepoRoot = path.join(__dirname, '../..');
// Next.js loads app-dir env first; forceReload replaces it with monorepo root `.env.local`.
// https://github.com/vercel/next.js/issues/92040 — keep secrets in repo root, not apps/*/.
const isDev = process.env.NODE_ENV !== 'production';
loadEnvConfig(monorepoRoot, isDev, undefined, true);

const nextConfig: NextConfig = {
  // Set the monorepo root so Next.js traces dependencies correctly and
  // doesn't confuse ~/package-lock.json with our pnpm workspace root.
  outputFileTracingRoot: path.join(__dirname, '../../'),

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
