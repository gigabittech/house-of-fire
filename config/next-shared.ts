import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

/** Monorepo root — matches pnpm workspace + hoisted `next` (see `.npmrc`). */
export const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Dev-performance defaults for 8 GB RAM machines.
 * ~1.5 GB Turbopack cap leaves headroom for the OS, browser, and IDE.
 */
const TURBOPACK_MEMORY_LIMIT_BYTES = 1_610_612_736;

/** Packages tree-shaken at import sites to shrink dev bundles and HMR graphs. */
export const optimizePackageImports = [
  '@hof/ui',
  '@hof/design-tokens',
  '@supabase/supabase-js',
  '@supabase/ssr',
  'qrcode',
] as const;

/**
 * Settings shared by every Next app in the monorepo.
 * App-specific config (images, server externals, etc.) is merged on top.
 */
export function createMonorepoNextBase(): NextConfig {
  return {
    // Typecheck via `pnpm typecheck` — Next's in-build checker OOMs on large types.
    typescript: {
      ignoreBuildErrors: true,
    },

    // Required for workspace `transpilePackages` + hoisted `next` at repo root.
    turbopack: {
      root: monorepoRoot,
    },
    outputFileTracingRoot: monorepoRoot,
    transpilePackages: ['@hof/ui', '@hof/design-tokens'],

    // Keep fewer compiled routes hot in dev to reduce RAM.
    onDemandEntries: {
      maxInactiveAge: 60 * 1000,
      pagesBufferLength: 2,
    },

    devIndicators: false,

    logging: {
      fetches: {
        fullUrl: false,
        hmrRefreshes: false,
      },
      incomingRequests: false,
    },

    experimental: {
      optimizePackageImports: [...optimizePackageImports],
      // Cap Turbopack heap so dev cannot consume all system RAM.
      turbopackMemoryLimit: TURBOPACK_MEMORY_LIMIT_BYTES,
      // Child processes reclaim memory more aggressively than worker threads on Windows.
      turbopackPluginRuntimeStrategy: 'childProcesses',
      // Single compilation lane — slower compiles, fewer parallel memory spikes.
      cpus: 1,
      // Disk cache speeds restarts; default true in Next 16 — explicit for clarity.
      turbopackFileSystemCacheForDev: true,
      // Server HMR doubles watcher + invalidation work; full restart is cheaper on low RAM.
      turbopackServerFastRefresh: false,
    },
  };
}
