import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import { createMonorepoNextBase, monorepoRoot, optimizePackageImports } from '../../config/next-shared';

// Next.js caches env from the app dir first (no .env there). forceReload loads monorepo root.
// https://github.com/vercel/next.js/issues/92040
const isDev = process.env.NODE_ENV !== 'production';
loadEnvConfig(monorepoRoot, isDev, undefined, true);

const monorepoBase = createMonorepoNextBase();

const nextConfig: NextConfig = {
  ...monorepoBase,

  experimental: {
    ...monorepoBase.experimental,
    optimizePackageImports: [
      ...optimizePackageImports,
      '@stripe/stripe-js',
      '@stripe/react-stripe-js',
      'stripe',
    ],
  },

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
