import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RECEIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Paths tried in order — works in dev, Vercel (traced file), and monorepo root cwd. */
function logoFileCandidates(): string[] {
  const mobileRoot = path.resolve(RECEIPT_DIR, '../../..');
  return [
    path.join(process.cwd(), 'public', 'assets', 'hof-logo-black.png'),
    path.join(mobileRoot, 'public', 'assets', 'hof-logo-black.png'),
    path.join(process.cwd(), 'apps', 'mobile', 'public', 'assets', 'hof-logo-black.png'),
  ];
}

function readLogoFromDisk(): string | null {
  for (const filePath of logoFileCandidates()) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        return `data:image/png;base64,${data.toString('base64')}`;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

async function fetchLogoFromAppUrl(): Promise<string | null> {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (!base) return null;

  try {
    const res = await fetch(`${base}/assets/hof-logo-black.png`, {
      cache: 'force-cache',
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

let cached: string | null | undefined;

/**
 * Logo for receipt PDF (base64 data URI). Disk first; production fallback fetches
 * from the deployed app's /assets URL when fs is unavailable in serverless.
 */
export async function loadReceiptLogoDataUri(): Promise<string | null> {
  if (cached !== undefined) return cached;

  const fromDisk = readLogoFromDisk();
  if (fromDisk) {
    cached = fromDisk;
    return cached;
  }

  const fromUrl = await fetchLogoFromAppUrl();
  if (fromUrl) {
    cached = fromUrl;
    return cached;
  }

  console.warn('[receipt] PDF logo not found. Tried:', logoFileCandidates());
  cached = null;
  return null;
}
