'use client';

import { colors } from '@hof/design-tokens';
import { HofButton, Icon } from '@hof/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  // AuthDivider,
  AuthErrorBanner,
  AuthInput,
  AuthLabel,
  AuthLegalFooter,
  AuthPhoneRow,
  authContentPadding,
  authHeadlineStyle,
  authSubtextStyle,
} from '../components/auth/AuthFormPrimitives';
import { useAuthNavigation } from '../components/auth/AuthNavigation';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { CHANNELS } from '../data/posts';
// import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { displayNameFromGoogleMetadata } from '../lib/auth/googleOAuth';
import { createClient } from '../lib/supabase';

function formatPhoneFn(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

interface FormData {
  first: string;
  last: string;
  email: string;
  phone: string;
  displayName: string;
  channels: string[];
}

function StepSignup({
  data,
  setField,
  onSignIn,
  onNext,
  loading,
  error,
}: {
  data: FormData;
  setField: (k: keyof FormData, v: string | string[]) => void;
  onSignIn: () => void;
  onNext: () => void;
  loading: boolean;
  error: string;
}) {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const phoneOk = data.phone.replace(/\D/g, '').length >= 10;
  const valid = data.first.trim().length > 0 && data.last.trim().length > 0 && emailOk && phoneOk;

  return (
    <div style={{ padding: authContentPadding }}>
      <div style={authHeadlineStyle}>Let&apos;s get you in.</div>
      <div style={authSubtextStyle}>
        Members get first crack at tickets, photos, and the discussion board.
      </div>

      {/* <div style={{ marginTop: 22 }}>
        <GoogleSignInButton
          flow="sign_up"
          next="/onboarding?oauth=complete"
          disabled={loading}
        />
      </div> */}

      {/* <AuthDivider /> */}

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <AuthLabel>First name</AuthLabel>
          <AuthInput
            value={data.first}
            onChange={(e) => setField('first', e.target.value)}
            placeholder="First"
            autoComplete="given-name"
          />
        </div>
        <div style={{ flex: 1 }}>
          <AuthLabel>Last name</AuthLabel>
          <AuthInput
            value={data.last}
            onChange={(e) => setField('last', e.target.value)}
            placeholder="Last"
            autoComplete="family-name"
          />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <AuthLabel>Email</AuthLabel>
        <AuthInput
          value={data.email}
          onChange={(e) => setField('email', e.target.value)}
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
        />
      </div>
      <div style={{ marginTop: 14 }}>
        <AuthLabel>Phone</AuthLabel>
        <AuthPhoneRow value={data.phone} onChange={(v) => setField('phone', formatPhoneFn(v))} />
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 12,
            color: colors.textSec,
            marginTop: 8,
            lineHeight: 1.45,
          }}
        >
          We text once when tickets drop, and once on the day-of. Nothing else.
        </div>
      </div>

      <AuthErrorBanner message={error} />

      <div style={{ marginTop: error ? 16 : 28 }}>
        <HofButton variant="primary" full disabled={!valid || loading} onClick={onNext}>
          {loading ? 'Sending link…' : valid ? 'Continue' : 'Fill in your details'}
        </HofButton>
      </div>

      <div
        style={{
          textAlign: 'center',
          marginTop: 16,
          fontFamily: 'Inter',
          fontSize: 13,
          color: colors.textSec,
        }}
      >
        Already a member?{' '}
        <button
          type="button"
          className="hof-btn"
          onClick={onSignIn}
          style={{
            color: colors.amber,
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Sign in →
        </button>
      </div>

      <AuthLegalFooter />
    </div>
  );
}

function StepChannels({
  data,
  setField,
  onBack,
  onNext,
}: {
  data: FormData;
  setField: (k: keyof FormData, v: string | string[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const toggle = (id: string) => {
    const has = data.channels.includes(id);
    setField('channels', has ? data.channels.filter((c) => c !== id) : [...data.channels, id]);
  };

  const nonLockedChannels = CHANNELS.filter((c) => !c.locked);

  return (
    <div style={{ padding: authContentPadding }}>
      <div style={authHeadlineStyle}>
        What do you want
        <br />
        to follow?
      </div>
      <div style={{ ...authSubtextStyle, marginTop: 10 }}>
        Pick the channels that should land on your home feed. Change this anytime.
      </div>

      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {nonLockedChannels.map((c) => {
          const on = data.channels.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              className="hof-btn hof-press"
              onClick={() => toggle(c.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                background: on ? colors.elevated : colors.surface,
                border: on ? `2px solid ${colors.amber}` : `1px solid ${colors.border}`,
                borderRadius: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: 14,
                    color: on ? colors.amber : colors.text,
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                  }}
                >
                  #{c.name}
                </div>
                {c.desc != null && (
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: colors.textSec,
                      marginTop: 2,
                    }}
                  >
                    {c.desc}
                  </div>
                )}
              </div>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: on ? colors.amber : 'transparent',
                  border: `1.5px solid ${on ? colors.amber : colors.borderHi}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {on && <Icon name="check" size={14} color={colors.bg} />}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        <HofButton
          variant="ghost"
          onClick={onBack}
          icon={<Icon name="arrowL" size={14} color={colors.text} />}
        >
          Back
        </HofButton>
        <div style={{ flex: 1 }}>
          <HofButton variant="primary" full onClick={onNext}>
            {data.channels.length > 0
              ? `Follow ${data.channels.length} channel${data.channels.length === 1 ? '' : 's'}`
              : 'Skip for now'}
          </HofButton>
        </div>
      </div>
    </div>
  );
}

function StepWelcome({
  data,
  onComplete,
  viaGoogle,
}: {
  data: FormData;
  onComplete: () => void;
  viaGoogle: boolean;
}) {
  return (
    <div style={{ padding: authContentPadding, textAlign: 'center' }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          margin: '0 auto',
          background: `linear-gradient(135deg, ${colors.amber}, ${colors.ember})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'hof-glow 2s ease-in-out infinite',
        }}
      >
        <Icon name="flame" size={40} color={colors.bg} />
      </div>
      <div
        style={{
          fontFamily: 'Clash Display',
          fontWeight: 700,
          fontSize: 36,
          color: colors.text,
          marginTop: 22,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        You&apos;re in.
      </div>
      <div
        style={{
          fontFamily: 'Inter',
          fontSize: 15,
          color: colors.textSec,
          marginTop: 12,
          lineHeight: 1.55,
          maxWidth: 300,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        Welcome, {data.first.length > 0 ? data.first : 'friend'}. The next theme is Fri Jun 26 —
        tickets close when we hit 300. Lock yours in.
      </div>

      <div style={{ marginTop: 32, padding: '0 4px' }}>
        <HofButton
          variant="primary"
          full
          onClick={onComplete}
          icon={<Icon name="ticket" size={18} color={colors.bg} />}
        >
          Get Theme 24 tickets
        </HofButton>
        <div style={{ height: 10 }} />
        <HofButton variant="ghost" full onClick={onComplete}>
          Just look around first
        </HofButton>
      </div>

      {!viaGoogle ? (
        <div
          style={{
            marginTop: 28,
            padding: 16,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 11,
              color: colors.amber,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            What&apos;s next
          </div>
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 13,
              color: colors.text,
              lineHeight: 1.5,
              textAlign: 'left',
            }}
          >
            We just sent a verification link to{' '}
            <span style={{ fontWeight: 500 }}>
              {data.email.length > 0 ? data.email : 'your email'}
            </span>
            . Click it to confirm — or keep going, you can verify later.
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { navigate, replace } = useAuthNavigation();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [viaGoogle, setViaGoogle] = useState(false);
  const [data, setData] = useState<FormData>({
    first: '',
    last: '',
    email: '',
    phone: '',
    displayName: '',
    channels: ['general', 'lineup'],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (k: keyof FormData, v: string | string[]) => setData((d) => ({ ...d, [k]: v }));

  useEffect(() => {
    if (searchParams.get('oauth') !== 'complete') return;

    const supabase = createClient();
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const fullName = displayNameFromGoogleMetadata(meta, user.email);
      const parts = fullName.split(/\s+/);
      const first = parts[0] ?? '';
      const last = parts.slice(1).join(' ');

      setData((d) => ({
        ...d,
        first: first || d.first,
        last: last || d.last,
        email: user.email ?? d.email,
        displayName: fullName,
      }));
      setViaGoogle(true);
      setStep(2);
      replace('/onboarding');
    })();
  }, [searchParams, replace]);

  const onComplete = () => router.push('/');
  const onSignIn = () => navigate('/sign-in');

  async function handleStep1Next() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        flow: 'sign_up',
        redirectTo: `${window.location.origin}/auth/callback/client?next=${encodeURIComponent('/')}&flow=sign_up`,
        userData: {
          first_name: data.first,
          last_name: data.last,
          display_name: `${data.first} ${data.last}`.trim(),
          phone: data.phone,
        },
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? 'Could not send confirmation email.');
      return;
    }
    setStep(2);
  }

  return (
    <AuthScreenShell progressStep={step}>
      {step === 1 && (
        <StepSignup
          data={data}
          setField={setField}
          onSignIn={onSignIn}
          onNext={() => {
            void handleStep1Next();
          }}
          loading={loading}
          error={error}
        />
      )}
      {step === 2 && (
        <StepChannels
          data={data}
          setField={setField}
          onBack={() => setStep(1)}
          onNext={() => {
            fetch('/api/user/settings', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ home_channels: data.channels }),
            }).catch(console.error);
            setStep(3);
          }}
        />
      )}
      {step === 3 && <StepWelcome data={data} onComplete={onComplete} viaGoogle={viaGoogle} />}
    </AuthScreenShell>
  );
}
