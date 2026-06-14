import { type NextRequest, NextResponse } from 'next/server';
import { resolvePostPreviewPath } from '@/lib/previewRedirect.server';
import {
  isPreviewAccessEnabled,
  previewAccessCookieOptions,
  previewAccessGrantToken,
  PREVIEW_ACCESS_COOKIE,
  previewPasswordMatches,
} from '@/lib/previewAccess.server';

export async function POST(request: NextRequest) {
  if (!isPreviewAccessEnabled()) {
    return NextResponse.json({ error: 'Preview access is disabled' }, { status: 403 });
  }

  const expectedPass = process.env.PREVIEW_ACCESS_PASS?.trim();
  if (!expectedPass) {
    return NextResponse.json({ error: 'Preview access is not configured' }, { status: 503 });
  }

  const body = (await request.json()) as { password?: string };
  const password = body.password ?? '';

  if (!previewPasswordMatches(password, expectedPass)) {
    return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
  }

  const token = previewAccessGrantToken();
  if (!token) {
    return NextResponse.json({ error: 'Preview access is not configured' }, { status: 503 });
  }

  const redirectTo = resolvePostPreviewPath();

  const response = NextResponse.json({ ok: true, redirectTo });
  response.cookies.set(PREVIEW_ACCESS_COOKIE, token, previewAccessCookieOptions());
  return response;
}
