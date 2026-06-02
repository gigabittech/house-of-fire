'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@hof/design-tokens';
import { HofButton, HofLogoMark } from '@hof/ui';
import { createClient } from '../../../../lib/supabase.js';

function parseHash(hash: string): Record<string, string> {
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  const out: Record<string, string> = {};
  for (const part of h.split('&')) {
    if (!part) continue;
    const [k, v] = part.split('=');
    if (!k) continue;
    out[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
  }
  return out;
}

export default function AuthCallbackClientPage() {
  const router = useRouter();
  const supabase = createClient();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    // If we're in a PKCE "code" flow, let the server callback set httpOnly cookies.
    if (code) {
      const next = url.searchParams.get('next') ?? '/';
      window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`);
      return;
    }

    // If we're in an implicit flow, tokens arrive in the URL hash (fragment),
    // which the server cannot read.
    const hash = parseHash(window.location.hash);
    const accessToken = hash.access_token;
    const refreshToken = hash.refresh_token;

    if (!accessToken || !refreshToken) {
      setMsg('Could not verify your sign-in link. Please request a new link.');
      return;
    }

    (async () => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setMsg('Could not verify your sign-in link. Please request a new link.');
        return;
      }

      router.replace('/');
      router.refresh();
    })().catch(() => {
      setMsg('Could not verify your sign-in link. Please request a new link.');
    });
  }, [router, supabase]);

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
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
            width: 'min(100%, 520px)',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            padding: 18,
          }}
        >
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
              fontFamily: 'Inter',
              fontSize: 14,
              color: colors.text,
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            {msg}
          </div>

          {msg.includes('Could not') ? (
            <div style={{ marginTop: 14 }}>
              <HofButton full onClick={() => router.replace('/landing')}>
                Back to sign in
              </HofButton>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

