'use client';

import { colors } from '@hof/design-tokens';
import { HofButton, HofLogoMark, Icon, useResponsive } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CHANNELS } from '../data/posts';
import { createClient } from '../lib/supabase';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatPhoneFn(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// ─── Local atoms ────────────────────────────────────────────────────────────

function OnboardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'Inter',
        fontSize: 11,
        color: colors.textSec,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

interface OnboardInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function OnboardInput(props: OnboardInputProps) {
  const { style, ...rest } = props;
  return (
    <input
      {...rest}
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
        ...style,
      }}
    />
  );
}

function PhoneRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: colors.surface,
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px 0 14px',
          background: colors.elevated,
          color: colors.textSec,
          fontFamily: 'JetBrains Mono',
          fontSize: 13,
          borderRight: `1px solid ${colors.border}`,
          letterSpacing: '0.04em',
        }}
      >
        +1
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="(555) 123-4567"
        type="tel"
        inputMode="tel"
        style={{
          flex: 1,
          height: 48,
          padding: '0 14px',
          background: 'transparent',
          border: 0,
          outline: 'none',
          fontFamily: 'Inter',
          fontSize: 14,
          color: colors.text,
          fontVariantNumeric: 'tabular-nums',
        }}
      />
    </div>
  );
}

// ─── State shape ────────────────────────────────────────────────────────────

interface FormData {
  first: string;
  last: string;
  email: string;
  phone: string;
  displayName: string;
  channels: string[];
}

// ─── Step 1: account info ────────────────────────────────────────────────────

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
  const supabase = createClient();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const phoneOk = data.phone.replace(/\D/g, '').length >= 10;
  const valid = data.first.trim().length > 0 && data.last.trim().length > 0 && emailOk && phoneOk;

  return (
    <div style={{ padding: '24px 20px' }}>
      <HofLogoMark size={90} />
      <div
        style={{
          fontFamily: 'Clash Display',
          fontWeight: 700,
          fontSize: 32,
          color: colors.text,
          marginTop: 18,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          textTransform: 'uppercase',
        }}
      >
        Let&apos;s get you in.
      </div>
      <div
        style={{
          fontFamily: 'Inter',
          fontSize: 14,
          color: colors.textSec,
          marginTop: 8,
          lineHeight: 1.5,
        }}
      >
        Members get first crack at tickets, photos, and the discussion board.
      </div>

      {/* Apple SSO */}
      <div style={{ marginTop: 22 }}>
        <HofButton
          variant="quiet"
          full
          size="lg"
          icon={<Icon name="apple" size={18} color={colors.text} />}
          onClick={() => {
            void supabase.auth.signInWithOAuth({
              provider: 'apple',
              options: {
                redirectTo: `${window.location.origin}/auth/callback/client?next=${encodeURIComponent('/')}`,
              },
            });
          }}
        >
          Continue with Apple
        </HofButton>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '22px 0',
        }}
      >
        <div style={{ flex: 1, height: 1, background: colors.border }} />
        <span
          style={{
            fontFamily: 'Inter',
            fontSize: 11,
            color: colors.textSec,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
          }}
        >
          or with email
        </span>
        <div style={{ flex: 1, height: 1, background: colors.border }} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <OnboardLabel>First name</OnboardLabel>
          <OnboardInput
            value={data.first}
            onChange={(e) => setField('first', e.target.value)}
            placeholder="First"
            autoComplete="given-name"
          />
        </div>
        <div style={{ flex: 1 }}>
          <OnboardLabel>Last name</OnboardLabel>
          <OnboardInput
            value={data.last}
            onChange={(e) => setField('last', e.target.value)}
            placeholder="Last"
            autoComplete="family-name"
          />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <OnboardLabel>Email</OnboardLabel>
        <OnboardInput
          value={data.email}
          onChange={(e) => setField('email', e.target.value)}
          placeholder="you@example.com"
          type="email"
        />
      </div>
      <div style={{ marginTop: 14 }}>
        <OnboardLabel>Phone</OnboardLabel>
        <PhoneRow value={data.phone} onChange={(v) => setField('phone', formatPhoneFn(v))} />
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

      {error.length > 0 && (
        <div
          style={{
            marginTop: 16,
            padding: '10px 14px',
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: 8,
            fontFamily: 'Inter',
            fontSize: 13,
            color: '#f87171',
            lineHeight: 1.45,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginTop: 28 }}>
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

      <div
        style={{
          marginTop: 28,
          textAlign: 'center',
          fontFamily: 'Inter',
          fontSize: 11,
          color: colors.textDis,
          lineHeight: 1.6,
        }}
      >
        By continuing you agree to our Terms and Privacy. We don&apos;t sell data, ever.
      </div>
    </div>
  );
}

// ─── Step 2: channel picker ──────────────────────────────────────────────────

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
    <div style={{ padding: '24px 20px' }}>
      <div
        style={{
          fontFamily: 'Clash Display',
          fontWeight: 700,
          fontSize: 32,
          color: colors.text,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          textTransform: 'uppercase',
        }}
      >
        What do you want
        <br />
        to follow?
      </div>
      <div
        style={{
          fontFamily: 'Inter',
          fontSize: 14,
          color: colors.textSec,
          marginTop: 10,
          lineHeight: 1.5,
        }}
      >
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

// ─── Step 3: welcome ─────────────────────────────────────────────────────────

function StepWelcome({ data, onComplete }: { data: FormData; onComplete: () => void }) {
  return (
    <div style={{ padding: '40px 20px 24px', textAlign: 'center' }}>
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
        Welcome, {data.first.length > 0 ? data.first : 'friend'}. The next edition is Fri Jun 26 —
        tickets close when we hit 300. Lock yours in.
      </div>

      <div style={{ marginTop: 32, padding: '0 4px' }}>
        <HofButton
          variant="primary"
          full
          onClick={onComplete}
          icon={<Icon name="ticket" size={18} color={colors.bg} />}
        >
          Get Edition 24 tickets
        </HofButton>
        <div style={{ height: 10 }} />
        <HofButton variant="ghost" full onClick={onComplete}>
          Just look around first
        </HofButton>
      </div>

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
    </div>
  );
}

// ─── Root screen ─────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  const { isWide } = useResponsive();

  const onComplete = () => router.push('/');
  const onSignIn = () => router.push('/sign-in');

  async function handleStep1Next() {
    setLoading(true);
    setError('');
    const { error: authErr } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback/client?next=${encodeURIComponent('/')}`,
        data: {
          first_name: data.first,
          last_name: data.last,
          display_name: `${data.first} ${data.last}`.trim(),
          phone: data.phone,
        },
      },
    });
    setLoading(false);
    if (authErr) {
      setError(authErr.message);
      return;
    }
    setStep(2);
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

        {/* Progress dots */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '14px 0 0',
          }}
        >
          {([1, 2, 3] as const).map((i) => (
            <div
              key={i}
              style={{
                width: i === step ? 22 : 6,
                height: 6,
                borderRadius: 3,
                background: i <= step ? colors.amber : colors.elevated,
                transition: 'width 200ms',
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <StepSignup
            data={data}
            setField={setField}
            onSignIn={onSignIn}
            onNext={handleStep1Next}
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
        {step === 3 && <StepWelcome data={data} onComplete={onComplete} />}

        {/* Bottom home area spacer */}
        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
