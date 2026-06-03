import { loadEnvConfig } from '@next/env';
import path from 'path';
import type { NextConfig } from 'next';

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

  // We use Biome for linting, not ESLint — disable Next's built-in ESLint step.
  eslint: { ignoreDuringBuilds: true },

  // next/image: allow local assets (empty domains) and Supabase storage.
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Allow '.js' extension imports to resolve to '.ts' / '.tsx' source files.
  // This matches TypeScript's Bundler moduleResolution semantics so local
  // imports can use the ESM-correct '.js' suffix throughout the codebase.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    config.resolve.extensionAlias = {
      '.js': ['.tsx', '.ts', '.js'],
      '.jsx': ['.tsx', '.ts', '.jsx'],
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return config;
  },
};

export default nextConfig;
