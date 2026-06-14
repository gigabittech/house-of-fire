'use client';

import { HofButton } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import {
  AuthErrorBanner,
  AuthInput,
  authContentPadding,
  authHeadlineStyle,
  authSubtextStyle,
} from '@/components/auth/AuthFormPrimitives';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';

export default function PreviewAccessScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/preview-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'Incorrect password. Please try again.');
      return;
    }

    router.push('/landing');
    router.refresh();
  }

  return (
    <AuthScreenShell>
      <form onSubmit={(event) => void handleSubmit(event)} style={{ padding: authContentPadding }}>
        <div style={authHeadlineStyle}>Private preview</div>
        <div style={authSubtextStyle}>
          This site isn&apos;t public yet. Enter the access password to continue.
        </div>

        <AuthInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Preview password"
          type="password"
          autoComplete="current-password"
          autoFocus
        />

        <AuthErrorBanner message={error} />

        <div style={{ marginTop: error ? 16 : 28 }}>
          <HofButton type="submit" variant="primary" full disabled={!password.trim() || loading}>
            {loading ? 'Checking…' : 'Enter'}
          </HofButton>
        </div>
      </form>
    </AuthScreenShell>
  );
}
