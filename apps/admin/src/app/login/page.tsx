'use client';

import { HofButton } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AuthErrorBanner,
  AuthInput,
  AuthLabel,
  AuthLegalFooter,
  authContentPadding,
  authHeadlineStyle,
  authSubtextStyle,
} from '@/components/auth/adminAuthForm';
import { AdminAuthScreenShell } from '@/components/auth/AdminAuthScreenShell';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
      } else {
        router.refresh();
        router.push('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  return (
    <AdminAuthScreenShell progressStep={1}>
      <div style={{ padding: authContentPadding }}>
        <div style={authHeadlineStyle}>Sign in.</div>
        <div style={authSubtextStyle}>
          Admin access for events, guests, door ops, and the rest of the house.
        </div>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
        >
          <AuthLabel>Email</AuthLabel>
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <div style={{ marginTop: 14 }}>
            <AuthLabel>Password</AuthLabel>
            <AuthInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <AuthErrorBanner message={error} />

          <div style={{ marginTop: error ? 16 : 28 }}>
            <HofButton variant="primary" full disabled={!canSubmit} type="submit">
              {loading ? 'Signing in…' : 'Sign in'}
            </HofButton>
          </div>
        </form>

        <AuthLegalFooter />
      </div>
    </AdminAuthScreenShell>
  );
}
