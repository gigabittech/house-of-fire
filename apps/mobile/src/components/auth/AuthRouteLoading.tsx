'use client';

import { HofSkeleton } from '@hof/ui';
import { authContentPadding } from './AuthFormPrimitives';
import { AuthScreenShell } from './AuthScreenShell';

function AuthFormSkeleton() {
  return (
    <div style={{ padding: authContentPadding }} aria-busy="true" aria-label="Loading">
      <HofSkeleton width="72%" height={34} radius={6} style={{ marginTop: 8 }} />
      <HofSkeleton width="100%" height={14} style={{ marginTop: 12 }} />
      <HofSkeleton width="88%" height={14} style={{ marginTop: 8 }} />

      <HofSkeleton width="100%" height={48} radius={8} style={{ marginTop: 22 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
        <HofSkeleton height={1} style={{ flex: 1 }} radius={0} />
        <HofSkeleton width={72} height={10} radius={4} />
        <HofSkeleton height={1} style={{ flex: 1 }} radius={0} />
      </div>

      <HofSkeleton width={48} height={10} radius={4} style={{ marginBottom: 8 }} />
      <HofSkeleton width="100%" height={48} radius={8} />

      <HofSkeleton width="100%" height={48} radius={8} style={{ marginTop: 28 }} />

      <HofSkeleton width="55%" height={13} radius={4} style={{ margin: '16px auto 0' }} />

      <HofSkeleton width="90%" height={10} radius={4} style={{ margin: '28px auto 0' }} />
    </div>
  );
}

/** Auth shell + form skeleton for Suspense fallbacks (e.g. onboarding). */
export function AuthRouteLoading({ progressStep = 1 }: { progressStep?: 1 | 2 | 3 }) {
  return (
    <AuthScreenShell progressStep={progressStep}>
      <AuthFormSkeleton />
    </AuthScreenShell>
  );
}
