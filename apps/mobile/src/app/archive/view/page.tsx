import { Suspense } from 'react';
import ArchiveThemeScreen from '../../../screens/ArchiveThemeScreen';

export const dynamic = 'force-dynamic';

export default function ArchiveThemePage() {
  return (
    <Suspense fallback={null}>
      <ArchiveThemeScreen />
    </Suspense>
  );
}
