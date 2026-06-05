'use client';

import { colors } from '@hof/design-tokens';
import { HofButton } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import {
  AuthDivider,
  AuthErrorBanner,
  AuthInput,
  AuthLabel,
  AuthLegalFooter,
  authContentPadding,
  authHeadlineStyle,
  authSubtextStyle,
} from '../components/auth/AuthFormPrimitives';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';

export default function SignInScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  async function handleSendLink() {
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        flow: 'sign_in',
        redirectTo: `${window.location.origin}/auth/callback/client?next=${encodeURIComponent('/')}&flow=sign_in`,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      const msg = data.error ?? 'Could not send sign-in link.';
      const normalized = msg.toLowerCase();
      if (normalized.includes('user') && normalized.includes('not')) {
        setError('No account exists for this email address. Please sign up first.');
        return;
      }
      if (normalized.includes('signups not allowed')) {
        setError('No account exists for this email address. Please sign up first.');
        return;
      }
      setError(msg);
      return;
    }

    setSent(true);
  }

  return (
    <AuthScreenShell progressStep={1}>
      <div style={{ padding: authContentPadding }}>
        <div style={authHeadlineStyle}>Sign in.</div>
        <div style={authSubtextStyle}>
          Members get first crack at tickets, photos, and the discussion board.
        </div>

        <div style={{ marginTop: 22 }}>
          <GoogleSignInButton flow="sign_in" next="/" disabled={loading} />
        </div>

        <AuthDivider />

        {!sent ? (
          <>
            <AuthLabel>Email</AuthLabel>
            <AuthInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="email"
            />

            <AuthErrorBanner message={error} />

            <div style={{ marginTop: error ? 16 : 28 }}>
              <HofButton
                variant="primary"
                full
                disabled={!isEmailValid || loading}
                onClick={() => {
                  void handleSendLink();
                }}
              >
                {loading ? 'Sending link…' : 'Send sign-in link'}
              </HofButton>
            </div>
          </>
        ) : (
          <div
            style={{
              padding: '14px 14px',
              borderRadius: 12,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                fontFamily: 'Inter',
                fontWeight: 500,
                fontSize: 14,
                color: colors.text,
              }}
            >
              Check your email
            </div>
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 12,
                color: colors.textSec,
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              Sent to <span style={{ color: colors.text }}>{email}</span>. Click the link to sign
              in.
            </div>
          </div>
        )}

        <div
          style={{
            textAlign: 'center',
            marginTop: 16,
            fontFamily: 'Inter',
            fontSize: 13,
            color: colors.textSec,
          }}
        >
          Not a member?{' '}
          <button
            type="button"
            className="hof-btn"
            onClick={() => router.push('/onboarding')}
            style={{
              color: colors.amber,
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Sign up →
          </button>
        </div>

        <AuthLegalFooter />
      </div>
    </AuthScreenShell>
  );
}
