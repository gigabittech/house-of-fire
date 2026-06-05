import { AuthScreenShell } from './AuthScreenShell';

/** Neutral shell shown while auth routes load — logo only, no stale form content. */
export function AuthRouteLoading() {
  return (
    <AuthScreenShell>
      <div style={{ minHeight: 240 }} aria-hidden />
    </AuthScreenShell>
  );
}
