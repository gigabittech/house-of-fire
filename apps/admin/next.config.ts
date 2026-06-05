import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import { createMonorepoNextBase, monorepoRoot } from '../../config/next-shared';

// Next.js loads app-dir env first; forceReload replaces it with monorepo root `.env.local`.
// https://github.com/vercel/next.js/issues/92040 — keep secrets in repo root, not apps/*/.
const isDev = process.env.NODE_ENV !== 'production';
loadEnvConfig(monorepoRoot, isDev, undefined, true);

const nextConfig: NextConfig = {
  ...createMonorepoNextBase(),

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
