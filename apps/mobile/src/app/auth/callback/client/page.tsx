'use client';

import { useEffect, useRef, useState } from 'react';
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

function sanitizeNext(nextRaw: string | null): string {
  const next = nextRaw ?? '/';
  return next.startsWith('/') && !next.startsWith('//') && next !== '/landing' ? next : '/';
}

const VERIFY_ERROR = 'Could not verify your sign-in link. Please request a new link.';

/** Poll until createBrowserClient finishes auto PKCE exchange from the URL. */
async function waitForSession(
  getSession: () => Promise<boolean>,
  attempts = 30,
  intervalMs = 100,
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if (await getSession()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

export default function AuthCallbackClientPage() {
  const router = useRouter();
  const supabase = createClient();
  const [msg, setMsg] = useState('Signing you in…');
  const finishedRef = useRef(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const next = sanitizeNext(url.searchParams.get('next'));
    const code = url.searchParams.get('code');
    const tokenHash = url.searchParams.get('token_hash') ?? url.searchParams.get('token');
    const type = url.searchParams.get('type');
    const hash = parseHash(window.location.hash);
    const accessToken = hash.access_token;
    const refreshToken = hash.refresh_token;

    const hasSession = async (): Promise<boolean> => {
      const { data } = await supabase.auth.getSession();
      return Boolean(data.session);
    };

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      router.replace(next);
      router.refresh();
    };

    const fail = () => {
      if (finishedRef.current) return;
      setMsg(VERIFY_ERROR);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        finish();
      }
    });

    (async () => {
      if (await hasSession()) {
        finish();
        return;
      }

      if (tokenHash && type) {
        await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as Parameters<typeof supabase.auth.verifyOtp>[0]['type'],
        });
        if (await hasSession()) {
          finish();
          return;
        }
        fail();
        return;
      }

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (await hasSession()) {
          finish();
          return;
        }
        fail();
        return;
      }

      if (code) {
        // @supabase/ssr auto-exchanges PKCE codes on load (detectSessionInUrl).
        // Wait for that before a manual exchange — a second exchange fails while
        // the session is already valid (user sees an error but is logged in).
        if (await waitForSession(hasSession)) {
          finish();
          return;
        }

        await supabase.auth.exchangeCodeForSession(code);
        if (await hasSession()) {
          finish();
          return;
        }
        fail();
        return;
      }

      if (await waitForSession(hasSession, 20)) {
        finish();
        return;
      }

      fail();
    })()
      .catch(async () => {
        if (await hasSession()) {
          finish();
          return;
        }
        fail();
      })
      .finally(() => {
        subscription.unsubscribe();
      });

    return () => {
      subscription.unsubscribe();
    };
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
              <HofButton full onClick={() => router.replace('/sign-in')}>
                Back to sign in
              </HofButton>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
