import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PreviewAccessScreen from '@/screens/PreviewAccessScreen';
import {
  isPreviewAccessEnabled,
  isPreviewAccessGrantCookieValid,
  PREVIEW_ACCESS_COOKIE,
} from '@/lib/previewAccess.server';
import { resolvePostPreviewPath } from '@/lib/previewRedirect.server';

export default async function Page() {
  if (!isPreviewAccessEnabled()) {
    redirect(resolvePostPreviewPath());
  }

  const cookie = (await cookies()).get(PREVIEW_ACCESS_COOKIE)?.value;
  if (isPreviewAccessGrantCookieValid(cookie)) {
    redirect(resolvePostPreviewPath());
  }

  return <PreviewAccessScreen />;
}
