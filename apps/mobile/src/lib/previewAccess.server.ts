import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const PREVIEW_ACCESS_COOKIE = 'hof_preview_access';
export const PREVIEW_ACCESS_PATH = '/preview-access';

/** True when `PREVIEW_ACCESS_IND` is enabled and a password is configured. */
export function isPreviewAccessEnabled(): boolean {
  const value = process.env.PREVIEW_ACCESS_IND?.trim().toLowerCase();
  if (!value) return false;
  const enabled = value === '1' || value === 'true' || value === 'yes' || value === 'on';
  if (!enabled) return false;
  return Boolean(process.env.PREVIEW_ACCESS_PASS?.trim());
}

export function isPreviewAccessRoute(pathname: string): boolean {
  return pathname === PREVIEW_ACCESS_PATH || pathname.startsWith(`${PREVIEW_ACCESS_PATH}/`);
}

/** Routes reachable before preview access is granted. */
export function isPreviewAccessExemptRoute(pathname: string): boolean {
  if (isPreviewAccessRoute(pathname)) return true;
  return pathname === '/api/preview-access';
}

export function previewAccessGrantToken(): string | null {
  const pass = process.env.PREVIEW_ACCESS_PASS?.trim();
  if (!pass) return null;
  return createHmac('sha256', pass).update('hof-preview-access-v1').digest('hex');
}

export function isPreviewAccessGranted(request: NextRequest): boolean {
  const token = previewAccessGrantToken();
  if (!token) return false;
  const cookie = request.cookies.get(PREVIEW_ACCESS_COOKIE)?.value;
  if (!cookie) return false;
  try {
    const a = Buffer.from(cookie);
    const b = Buffer.from(token);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function previewAccessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  };
}

export function previewPasswordMatches(input: string, expected: string): boolean {
  const inputBuf = Buffer.from(input);
  const expectedBuf = Buffer.from(expected);
  if (inputBuf.length !== expectedBuf.length) {
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }
  return timingSafeEqual(inputBuf, expectedBuf);
}
