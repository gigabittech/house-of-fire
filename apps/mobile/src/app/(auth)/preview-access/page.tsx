import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PreviewAccessScreen from '@/screens/PreviewAccessScreen';
import {
  isPreviewAccessEnabled,
  PREVIEW_ACCESS_COOKIE,
  previewAccessGrantToken,
} from '@/lib/previewAccess.server';

export default async function Page() {
  if (!isPreviewAccessEnabled()) {
    redirect('/landing');
  }

  const token = previewAccessGrantToken();
  const cookie = (await cookies()).get(PREVIEW_ACCESS_COOKIE)?.value;
  if (token && cookie === token) {
    redirect('/landing');
  }

  return <PreviewAccessScreen />;
}
