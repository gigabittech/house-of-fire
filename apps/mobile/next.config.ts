import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import path from 'node:path';

const monorepoRoot = path.join(__dirname, '../..');
// Next.js caches env from the app dir first (no .env there). forceReload loads monorepo root.
// https://github.com/vercel/next.js/issues/92040
const isDev = process.env.NODE_ENV !== 'production';
loadEnvConfig(monorepoRoot, isDev, undefined, true);

const nextConfig: NextConfig = {
  // Next's forked "Running TypeScript" step OOMs on Stripe + Supabase types; use `pnpm typecheck`.
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

  // @react-pdf/renderer must run on the server without webpack bundling issues.
  serverExternalPackages: ['@react-pdf/renderer', 'sharp'],

  // Receipt PDF reads logo from disk — copy into serverless bundles (monorepo-aware).
  outputFileTracingIncludes: {
    '/api/**/*': [
      './public/assets/hof-logo-black.png',
      './apps/mobile/public/assets/hof-logo-black.png',
    ],
  },

  // next/image: Supabase storage.
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
