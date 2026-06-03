'use client';

import { colors } from '@hof/design-tokens';
import { HofButton, HofLogoMark, useResponsive } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '../lib/supabase';

function AuthToggle({
  mode,
  onGoSignIn: _onGoSignIn,
  onGoSignUp,
}: {
  mode: 'sign-in' | 'sign-up';
  onGoSignIn: () => void;
  onGoSignUp: () => void;
}) {
  const item: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 500,
  };

  return (
    <div
      style={{
        marginTop: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <button
        type="button"
        className="hof-btn"
        onClick={onGoSignUp}
        style={{
          ...item,
          color: mode === 'sign-up' ? colors.text : colors.amber,
          opacity: mode === 'sign-up' ? 0.8 : 1,
        }}
      >
        Not a member? Sign Up →
      </button>
    </div>
  );
}

export default function SignInScreen() {
  const router = useRouter();
  const supabase = createClient();
  const { isWide } = useResponsive();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  async function handleSendLink() {
    setLoading(true);
    setError('');

    const { error: authErr } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback/client?next=${encodeURIComponent('/')}`,
        // Important: don't create accounts on the Sign In flow.
        shouldCreateUser: false,
      },
    });

    setLoading(false);

    if (authErr) {
      const msg = authErr.message ?? 'Could not send sign-in link.';
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
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
        background: colors.bg,
      }}
    >
      <div
        className="hof-scroll"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: isWide ? '50%' : 0,
          right: isWide ? 'auto' : 0,
          transform: isWide ? 'translateX(-50%)' : undefined,
          width: isWide ? 'min(100%, 520px)' : 'auto',
          overflowY: 'auto',
        }}
      >
        <div style={{ height: 54 }} />

        {/* Header */}
        <div style={{ padding: '10px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HofLogoMark size={22} />
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: 11,
                color: colors.textSec,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              House of Fire
            </div>
          </div>

          <div
            style={{
              fontFamily: 'Clash Display',
              fontWeight: 700,
              fontSize: 44,
              color: colors.text,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginTop: 16,
              textTransform: 'uppercase',
            }}
          >
            Sign in.
          </div>
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 14,
              color: colors.textSec,
              marginTop: 12,
              lineHeight: 1.5,
              maxWidth: 360,
            }}
          >
            Enter your email and we&apos;ll send a sign-in link. One tap, you&apos;re in.
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 16px 0' }}>
          {error ? (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(232,101,26,0.10)',
                border: `1px solid ${colors.border}`,
                fontFamily: 'Inter',
                fontSize: 13,
                color: colors.text,
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          ) : null}

          {!sent ? (
            <>
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: 11,
                  color: colors.textSec,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginTop: error ? 14 : 0,
                  marginBottom: 8,
                }}
              >
                Email
              </div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: 48,
                  padding: '0 14px',
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  fontFamily: 'Inter',
                  fontSize: 14,
                  color: colors.text,
                  outline: 'none',
                }}
              />

              <div style={{ marginTop: 14 }}>
                <HofButton
                  variant="primary"
                  full
                  disabled={!isEmailValid || loading}
                  onClick={() => {
                    void handleSendLink();
                  }}
                >
                  {loading ? 'Sending…' : 'Send sign-in link'}
                </HofButton>
              </div>

              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="hof-btn"
                  onClick={() => router.push('/landing')}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    height: 44,
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: colors.textSec,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
              </div>

              <AuthToggle
                mode="sign-in"
                onGoSignIn={() => {}}
                onGoSignUp={() => router.push('/onboarding')}
              />
            </>
          ) : (
            <>
              <div
                style={{
                  marginTop: error ? 14 : 0,
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
                  Sent to <span style={{ color: colors.text }}>{email}</span>. Click the link to
                  sign in.
                </div>
              </div>

              <AuthToggle
                mode="sign-in"
                onGoSignIn={() => {}}
                onGoSignUp={() => router.push('/onboarding')}
              />
            </>
          )}
        </div>

        <div style={{ height: 36 }} />
      </div>
    </div>
  );
}
