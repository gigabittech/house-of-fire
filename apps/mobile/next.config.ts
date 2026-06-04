import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import path from 'node:path';

const monorepoRoot = path.join(__dirname, '../..');
// Next.js caches env from the app dir first (no .env there). forceReload loads monorepo root.
// https://github.com/vercel/next.js/issues/92040
const isDev = process.env.NODE_ENV !== 'production';
loadEnvConfig(monorepoRoot, isDev, undefined, true);

const nextConfig: NextConfig = {
  // Set the monorepo root so Next.js traces dependencies correctly and
  // doesn't confuse ~/package-lock.json with our pnpm workspace root.
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // Workspace packages ship built ESM; transpile them through Next for safety.
  transpilePackages: ['@hof/ui', '@hof/design-tokens'],

  // @react-pdf/renderer must run on the server without webpack bundling issues.
  serverExternalPackages: ['@react-pdf/renderer'],

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
