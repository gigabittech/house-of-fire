'use client';

import { HofLogoMark } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--hof-bg)',
      }}
    >
      <div
        style={{
          width: 400,
          padding: '24px 32px 28px',
          background: 'var(--hof-surface)',
          border: '1px solid var(--hof-border)',
          borderRadius: 14,
        }}
      >
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              lineHeight: 0,
              overflow: 'hidden',
              marginTop: -10,
              marginBottom: -6,
            }}
          >
            <div style={{ transform: 'translateX(-8px)' }}>
              <HofLogoMark fit="wordmark" width={150} alt="House of Fire" />
            </div>
          </div>
          <div
            style={{
              fontFamily: 'Clash Display, system-ui',
              fontWeight: 600,
              fontSize: 28,
              color: 'var(--hof-text)',
              marginTop: 8,
              letterSpacing: '-0.01em',
            }}
          >
            Sign in
          </div>
        </div>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 10,
                  color: 'var(--hof-text-sec)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px',
                  background: 'var(--hof-bg)',
                  border: '1px solid var(--hof-border)',
                  borderRadius: 8,
                  fontFamily: 'Inter, system-ui',
                  fontSize: 14,
                  color: 'var(--hof-text)',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 10,
                  color: 'var(--hof-text-sec)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px',
                  background: 'var(--hof-bg)',
                  border: '1px solid var(--hof-border)',
                  borderRadius: 8,
                  fontFamily: 'Inter, system-ui',
                  fontSize: 14,
                  color: 'var(--hof-text)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                background: 'rgba(232,74,26,0.12)',
                border: '1px solid rgba(232,74,26,0.3)',
                borderRadius: 8,
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: 'var(--hof-error)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 20,
              width: '100%',
              height: 46,
              background: loading ? 'var(--hof-elevated)' : 'var(--hof-amber)',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, system-ui',
              fontSize: 14,
              fontWeight: 600,
              color: loading ? 'var(--hof-text-sec)' : 'var(--hof-bg)',
              transition: 'background 120ms',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
