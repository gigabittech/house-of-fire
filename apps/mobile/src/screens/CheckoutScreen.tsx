'use client';

import { colors, layoutChrome } from '@hof/design-tokens';
import { EmptyState, HofMobilePageHeader, Icon, useResponsive } from '@hof/ui';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useAppHeader } from '@/hooks/useAppHeader';
import { INVENTORY_POLL_MS, useEventInventory } from '@/hooks/useEventInventory';
import {
  formatDoorsRange,
  formatEventDateShort,
  NO_EVENTS_MESSAGE,
  type UpcomingEvent,
} from '@/lib/eventDisplay';
import { computeCheckoutAmounts } from '@/lib/ticketPricing';
import { MAX_TICKETS_PER_ORDER } from '@/lib/ticketLimits';
import { formatZipCodeInput, isValidZipCode } from '@/lib/zipCode';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_placeholder',
);

const CHECKOUT_STORAGE_KEY = 'hof_checkout_v1';
/** Below this width the step labels stack under the circles instead of sitting inline. */
const CHECKOUT_STEP_NARROW_MAX = 394;

function subscribeCheckoutWidth(onStoreChange: () => void) {
  window.addEventListener('resize', onStoreChange);
  return () => window.removeEventListener('resize', onStoreChange);
}

function getCheckoutNarrowSnapshot(): boolean {
  return window.innerWidth < CHECKOUT_STEP_NARROW_MAX;
}

function useNarrowCheckoutSteps(): boolean {
  return useSyncExternalStore(subscribeCheckoutWidth, getCheckoutNarrowSnapshot, () => true);
}

function CheckoutStepIndicator({
  step,
  stepNames,
  stackedLabels,
}: {
  step: 1 | 2 | 3;
  stepNames: string[];
  /** Below 394px — labels sit under the step numbers; everything else unchanged. */
  stackedLabels: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      {stepNames.flatMap((name, i) => {
        const stepNode = (
          <div
            key={name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: stackedLabels ? 6 : 8,
              flexShrink: 0,
              flexDirection: stackedLabels ? 'column' : 'row',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                background: i < step ? colors.amber : colors.elevated,
                border: `1px solid ${i + 1 === step ? colors.amber : colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter',
                fontSize: 11,
                fontWeight: 600,
                color: i < step ? colors.bg : colors.textSec,
                flexShrink: 0,
              }}
            >
              {i + 1 < step ? <Icon name="check" size={12} color={colors.bg} /> : i + 1}
            </div>
            <span
              style={{
                fontFamily: 'Inter',
                fontSize: 11,
                fontWeight: 500,
                color: i + 1 === step ? colors.text : colors.textSec,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textAlign: stackedLabels ? 'center' : undefined,
                whiteSpace: stackedLabels ? 'normal' : 'nowrap',
              }}
            >
              {name}
            </span>
          </div>
        );

        if (i >= 2) return [stepNode];
        return [
          stepNode,
          <div
            key={`${name}-connector`}
            aria-hidden
            style={{
              flex: 1,
              height: 1,
              minWidth: 12,
              margin: '0 10px',
              background: i < step - 1 ? colors.amber : colors.border,
            }}
          />,
        ];
      })}
    </div>
  );
}

type CheckoutDraft = { tier: string; qty: number };

function loadCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CheckoutDraft) : null;
  } catch {
    return null;
  }
}

function saveCheckoutDraft(draft: CheckoutDraft) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(draft));
}

function clearCheckoutDraft() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
}

// ─── Form atoms ──────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
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

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { error, style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        height: 48,
        padding: '0 14px',
        background: colors.surface,
        border: `1px solid ${error ? colors.error : colors.border}`,
        borderRadius: 8,
        fontFamily: 'Inter',
        fontSize: 14,
        color: colors.text,
        outline: 'none',
        ...(style ?? {}),
      }}
    />
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'Inter',
        fontSize: 12,
        color: colors.error,
        marginTop: 6,
      }}
    >
      {children}
    </div>
  );
}

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'Inter',
        fontSize: 12,
        color: colors.textSec,
        marginTop: 8,
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '18px 0',
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
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: colors.border }} />
    </div>
  );
}

function PhoneInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  function format(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        width: '100%',
        boxSizing: 'border-box',
        background: colors.surface,
        borderRadius: 8,
        border: `1px solid ${error ? colors.error : colors.border}`,
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
        onChange={(e) => onChange(format(e.target.value))}
        placeholder="(555) 123-4567"
        type="tel"
        autoComplete="tel"
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

function SaveToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      className="hof-btn hof-press"
      onClick={() => onChange(!on)}
      style={{
        width: '100%',
        marginTop: 22,
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: on ? colors.elevated : colors.surface,
        border: on ? `1px solid ${colors.amber}` : `1px solid ${colors.border}`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          width: 38,
          height: 22,
          borderRadius: 12,
          flexShrink: 0,
          background: on ? colors.amber : colors.border,
          position: 'relative',
          transition: 'background 120ms',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 18 : 2,
            width: 18,
            height: 18,
            borderRadius: 9,
            background: '#fff',
            transition: 'left 120ms ease-out',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 14,
            color: colors.text,
          }}
        >
          Save my info for next time
        </div>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 12,
            color: colors.textSec,
            marginTop: 2,
          }}
        >
          Creates a House of Fire account.
        </div>
      </div>
    </button>
  );
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Step 1 ──────────────────────────────────────────────────────────────────

interface TierData {
  name: string;
  priceCents: number;
  feeCents: number;
  description: string | null;
  remaining: number;
  soldOut: boolean;
}

function StepTickets({
  tier,
  setTier,
  qty,
  setQty,
  tierData,
  subtotal,
  fees,
  maxQty,
  maxPerOrder,
}: {
  tier: string;
  setTier: (t: string) => void;
  qty: number;
  setQty: (q: number) => void;
  tierData: Record<string, TierData>;
  subtotal: number;
  fees: number;
  maxQty: number;
  maxPerOrder: number;
}) {
  return (
    <div>
      <div style={{ padding: '4px 16px 12px' }}>
        <div
          style={{
            fontFamily: 'Clash Display',
            fontWeight: 600,
            fontSize: 24,
            color: colors.text,
            letterSpacing: '-0.01em',
          }}
        >
          Select your tier
        </div>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 13,
            color: colors.textSec,
            marginTop: 4,
          }}
        >
          Limited release. Tiers go offline as they sell out.
        </div>
      </div>

      <div
        style={{
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {Object.entries(tierData).map(([id, t]) => {
          const disabled = t.soldOut;
          return (
            <button
              key={id}
              type="button"
              className="hof-btn hof-press"
              disabled={disabled}
              onClick={() => !disabled && setTier(id)}
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                background: tier === id ? colors.elevated : colors.surface,
                border: tier === id ? `2px solid ${colors.amber}` : `1px solid ${colors.border}`,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: disabled ? 0.45 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    border: `1.5px solid ${tier === id ? colors.amber : colors.borderHi}`,
                    background: tier === id ? colors.amber : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {tier === id && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        background: colors.bg,
                      }}
                    />
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontSize: 15,
                      color: colors.text,
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: colors.textSec,
                    }}
                  >
                    {disabled ? 'Sold out' : t.description?.trim() || 'Inclusive of fees'}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'Clash Display',
                  fontWeight: 600,
                  fontSize: 20,
                  color: colors.text,
                }}
              >
                {formatCurrency(t.priceCents)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quantity */}
      <div style={{ padding: '24px 16px 8px' }}>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 10,
            color: colors.textSec,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Quantity · max {maxPerOrder} per order
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
          }}
        >
          <span
            style={{
              fontFamily: 'Inter',
              fontSize: 14,
              color: colors.text,
            }}
          >
            Tickets
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="hof-btn hof-press"
              onClick={() => setQty(Math.max(1, qty - 1))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: colors.elevated,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="minus" size={16} color={qty === 1 ? colors.textDis : colors.text} />
            </button>
            <span
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 20,
                color: colors.text,
                width: 24,
                textAlign: 'center',
              }}
            >
              {qty}
            </span>
            <button
              className="hof-btn hof-press"
              onClick={() => setQty(Math.min(maxQty, qty + 1))}
              disabled={qty >= maxQty}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: colors.amber,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="plus" size={16} color={colors.bg} />
            </button>
          </div>
        </div>
      </div>

      {/* Itemized */}
      <div style={{ padding: '24px 16px 12px' }}>
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 16,
            fontFamily: 'Inter',
            fontSize: 13,
          }}
        >
          {(
            [
              [`${qty}× ${tierData[tier]?.name ?? ''}`, `$${subtotal.toFixed(2)}`],
              ['Service fee', `$${fees.toFixed(2)}`],
            ] as [string, string][]
          ).map(([k, v]) => (
            <div
              key={k}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                color: colors.textSec,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0 0',
              marginTop: 4,
              borderTop: `1px solid ${colors.border}`,
              color: colors.text,
              fontWeight: 500,
              fontFamily: 'Clash Display',
              fontSize: 16,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>Total</span>
            <span>${(subtotal + fees).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2 ──────────────────────────────────────────────────────────────────

interface Details {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zipCode: string;
  password: string;
}

type CheckoutProfile = {
  display_name: string;
  email: string | null;
  phone: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0] ?? '', lastName: '' };
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

function formatPhoneForCheckoutInput(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const ten =
    digits.length >= 11 && digits.startsWith('1') ? digits.slice(1, 11) : digits.slice(0, 10);
  if (ten.length <= 3) return ten;
  if (ten.length <= 6) return `(${ten.slice(0, 3)}) ${ten.slice(3)}`;
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

function detailsFromProfile(profile: CheckoutProfile): Partial<Details> {
  const fromName =
    profile.first_name || profile.last_name
      ? {
          firstName: profile.first_name?.trim() ?? '',
          lastName: profile.last_name?.trim() ?? '',
        }
      : splitDisplayName(profile.display_name);
  return {
    firstName: fromName.firstName,
    lastName: fromName.lastName,
    email: profile.email?.trim() ?? '',
    phone: formatPhoneForCheckoutInput(profile.phone),
  };
}

function StepAccount({
  mode,
  setMode,
  details,
  setField,
  errors,
  isLoggedIn = false,
  checkoutReturn,
}: {
  mode: 'guest' | 'signup' | 'signin';
  setMode: (m: 'guest' | 'signup' | 'signin') => void;
  details: Details;
  setField: (k: keyof Details, v: string) => void;
  errors: { email?: boolean; phone?: boolean; zipCode?: boolean };
  isLoggedIn?: boolean;
  checkoutReturn: string;
}) {
  const isSignIn = mode === 'signin';
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInSent, setSignInSent] = useState(false);
  const [signInError, setSignInError] = useState('');
  const signInEmailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim());

  async function sendCheckoutSignInLink() {
    setSignInLoading(true);
    setSignInError('');
    const res = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: details.email.trim(),
        flow: 'sign_in',
        redirectTo: `${window.location.origin}/auth/callback/client?next=${encodeURIComponent(checkoutReturn)}&flow=sign_in`,
      }),
    });
    setSignInLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setSignInError(data.error ?? 'Could not send sign-in link.');
      return;
    }
    setSignInSent(true);
  }

  return (
    <div style={{ padding: '4px 16px 8px' }}>
      <div
        style={{
          fontFamily: 'Clash Display',
          fontWeight: 600,
          fontSize: 24,
          color: colors.text,
          letterSpacing: '-0.01em',
        }}
      >
        {isSignIn ? 'Welcome back' : 'Your details'}
      </div>
      <div
        style={{
          fontFamily: 'Inter',
          fontSize: 13,
          color: colors.textSec,
          marginTop: 4,
        }}
      >
        {isSignIn
          ? 'Sign in to your House of Fire account.'
          : 'For your ticket and how the door staff will find you.'}
      </div>

      {isSignIn && (
        <div style={{ marginTop: 22 }}>
          <GoogleSignInButton flow="sign_in" next={checkoutReturn} disabled={signInLoading} />
          <Divider>or email</Divider>
          {!signInSent ? (
            <>
              <FieldLabel>Email address</FieldLabel>
              <TextInput
                value={details.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
              />
              {signInError ? (
                <div
                  style={{
                    marginTop: 10,
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: '#f87171',
                  }}
                >
                  {signInError}
                </div>
              ) : null}
              <button
                type="button"
                className="hof-btn hof-press"
                disabled={!signInEmailOk || signInLoading}
                onClick={() => {
                  void sendCheckoutSignInLink();
                }}
                style={{
                  width: '100%',
                  marginTop: 16,
                  height: 48,
                  borderRadius: 12,
                  background: colors.amber,
                  color: colors.bg,
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: 15,
                  opacity: !signInEmailOk || signInLoading ? 0.5 : 1,
                }}
              >
                {signInLoading ? 'Sending link…' : 'Send sign-in link'}
              </button>
            </>
          ) : (
            <div
              style={{
                padding: '14px',
                borderRadius: 12,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                fontFamily: 'Inter',
                fontSize: 13,
                color: colors.textSec,
                lineHeight: 1.5,
              }}
            >
              Check your email for a sign-in link. After signing in, you&apos;ll return here to
              finish checkout.
            </div>
          )}
          <button
            className="hof-btn"
            onClick={() => setMode('guest')}
            style={{
              marginTop: 18,
              fontSize: 13,
              color: colors.amber,
              fontWeight: 500,
            }}
          >
            ← Not a member yet? Check out as guest
          </button>
        </div>
      )}

      {!isSignIn && (
        <>
          {!isLoggedIn && mode === 'signup' ? (
            <div style={{ marginTop: 22 }}>
              <GoogleSignInButton flow="sign_up" next={checkoutReturn} />
              <Divider>or continue as guest</Divider>
            </div>
          ) : null}
          <div
            style={{
              marginTop: isLoggedIn || mode !== 'signup' ? 22 : 0,
              display: 'flex',
              gap: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <FieldLabel>First name</FieldLabel>
              <TextInput
                value={details.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                placeholder="First"
                autoComplete="given-name"
              />
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel>Last name</FieldLabel>
              <TextInput
                value={details.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                placeholder="Last"
                autoComplete="family-name"
              />
            </div>
          </div>

          <div style={{ height: 12 }} />
          <FieldLabel>Email address</FieldLabel>
          <TextInput
            value={details.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            error={errors.email}
          />
          {errors.email && <FieldError>Use a valid email — your ticket goes here.</FieldError>}

          <div style={{ height: 12 }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px', minWidth: 0 }}>
              <FieldLabel>Phone number</FieldLabel>
              <PhoneInput
                value={details.phone}
                onChange={(v) => setField('phone', v)}
                error={errors.phone}
              />
            </div>
            <div style={{ flex: '1 1 140px', minWidth: 0 }}>
              <FieldLabel>Zip code</FieldLabel>
              <TextInput
                value={details.zipCode}
                onChange={(e) => setField('zipCode', formatZipCodeInput(e.target.value))}
                placeholder="80302"
                autoComplete="postal-code"
                inputMode="numeric"
                error={errors.zipCode}
              />
              {errors.zipCode && <FieldError>Enter a valid 5-digit ZIP code.</FieldError>}
            </div>
          </div>
          <HelperText>For ticket SMS and door lookup. We won&apos;t text you otherwise.</HelperText>

          {!isLoggedIn && (
            <SaveToggle
              on={mode === 'signup'}
              onChange={(on) => setMode(on ? 'signup' : 'guest')}
            />
          )}

          {mode === 'signup' && !isLoggedIn && (
            <div style={{ marginTop: 12 }}>
              <FieldLabel>Choose a password</FieldLabel>
              <TextInput
                value={details.password}
                onChange={(e) => setField('password', e.target.value)}
                type="password"
                placeholder="At least 6 characters"
              />
            </div>
          )}

          {!isLoggedIn && (
            <button
              className="hof-btn"
              onClick={() => setMode('signin')}
              style={{
                marginTop: 18,
                fontSize: 13,
                color: colors.textSec,
                fontWeight: 500,
              }}
            >
              Already a member? <span style={{ color: colors.amber }}>Sign in →</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Promo code section ───────────────────────────────────────────────────────

type PromoResult = {
  valid: boolean;
  code?: string;
  codeId?: string;
  discountCents?: number;
  label?: string;
  error?: string;
};

function PromoCodeSection({
  promoCode,
  setPromoCode,
  promoResult,
  setPromoResult,
  promoLoading,
  onApply,
  onClear,
}: {
  promoCode: string;
  setPromoCode: (v: string) => void;
  promoResult: PromoResult | null;
  setPromoResult: (r: PromoResult | null) => void;
  promoLoading: boolean;
  onApply: () => void;
  onClear: () => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ padding: '0 16px 20px' }}>
      <div
        style={{
          fontSize: 10,
          color: colors.textSec,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontFamily: 'Inter',
          marginBottom: 10,
        }}
      >
        Promo code
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onApply();
          }}
          placeholder="Enter code (e.g. FIREFAMILY)"
          style={{
            flex: 1,
            background: colors.elevated,
            border: `1px solid ${focused ? colors.borderHi : colors.border}`,
            borderRadius: 8,
            padding: '10px 12px',
            color: colors.text,
            fontFamily: 'JetBrains Mono',
            fontSize: 14,
            outline: 'none',
            letterSpacing: '0.04em',
          }}
        />
        <button
          className="hof-btn hof-press"
          onClick={onApply}
          disabled={promoLoading || promoCode.trim().length === 0}
          style={{
            padding: '10px 16px',
            background:
              promoLoading || promoCode.trim().length === 0 ? colors.elevated : colors.amber,
            border: `1px solid ${promoLoading || promoCode.trim().length === 0 ? colors.border : colors.amber}`,
            borderRadius: 8,
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 13,
            color: promoLoading || promoCode.trim().length === 0 ? colors.textDis : colors.bg,
            whiteSpace: 'nowrap',
            opacity: promoLoading || promoCode.trim().length === 0 ? 0.6 : 1,
          }}
        >
          {promoLoading ? '…' : 'Apply'}
        </button>
      </div>

      {/* Feedback */}
      {promoResult !== null && promoResult.valid && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontFamily: 'Inter',
              fontSize: 13,
              color: colors.success,
            }}
          >
            ✓ {promoResult.code ?? promoCode} applied — {promoResult.label ?? 'discount applied'}
          </span>
          <button
            className="hof-btn"
            onClick={() => {
              setPromoResult(null);
              setPromoCode('');
              onClear();
            }}
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              color: colors.textSec,
              padding: '2px 6px',
              borderRadius: 4,
              background: colors.elevated,
              border: `1px solid ${colors.border}`,
            }}
          >
            ✕
          </button>
        </div>
      )}
      {promoResult !== null && !promoResult.valid && (
        <div
          style={{
            marginTop: 8,
            fontFamily: 'Inter',
            fontSize: 13,
            color: colors.error,
          }}
        >
          ✗ {promoResult.error ?? 'Code not found'}
        </div>
      )}
    </div>
  );
}

// ─── Step 3 ──────────────────────────────────────────────────────────────────

function StepPaymentInner({
  paymentIntentId,
  intentAmount,
  subtotalCents,
  discountCents,
  feeCents: feeCentsProp,
  promoResult,
  setPromoResult,
  promoCode,
  setPromoCode,
  promoLoading,
  onApplyPromo,
  onClearPromo,
  onSuccess,
}: {
  paymentIntentId: string;
  clientSecret: string;
  intentAmount: number;
  subtotalCents: number;
  discountCents: number;
  feeCents: number;
  promoResult: PromoResult | null;
  setPromoResult: (r: PromoResult | null) => void;
  promoCode: string;
  setPromoCode: (v: string) => void;
  promoLoading: boolean;
  onApplyPromo: () => void;
  onClearPromo: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState('');

  const discountedSubtotal = subtotalCents - discountCents;
  const feeCents = feeCentsProp;
  const displayTotal = intentAmount;

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setConfirming(true);
    setErr('');
    const returnUrl = new URL('/ticket', window.location.origin);
    returnUrl.searchParams.set('purchased', '1');
    if (paymentIntentId) {
      returnUrl.searchParams.set('payment_intent', paymentIntentId);
    }
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl.toString() },
      redirect: 'if_required',
    });
    if (error) {
      setConfirming(false);
      setErr(error.message ?? 'Payment failed');
      return;
    }
    if (!paymentIntentId) {
      setConfirming(false);
      setErr('Payment session expired. Go back and try again.');
      return;
    }
    try {
      const r = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      });
      const d = (await r.json()) as { error?: string };
      if (!r.ok) {
        setErr(d.error ?? 'Could not confirm your ticket. Please contact support.');
        setConfirming(false);
        return;
      }
      clearCheckoutDraft();
      onSuccess();
    } catch {
      setErr('Could not confirm your ticket. Check your connection and try again.');
    }
    setConfirming(false);
  };

  return (
    <div>
      {/* Promo code section */}
      <PromoCodeSection
        promoCode={promoCode}
        setPromoCode={setPromoCode}
        promoResult={promoResult}
        setPromoResult={setPromoResult}
        promoLoading={promoLoading}
        onApply={onApplyPromo}
        onClear={onClearPromo}
      />

      {/* Price breakdown */}
      <div style={{ padding: '0 16px 20px' }}>
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 16,
            fontFamily: 'Inter',
            fontSize: 13,
          }}
        >
          {/* Subtotal row — strikethrough when discounted */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              fontVariantNumeric: 'tabular-nums',
              color: discountCents > 0 ? colors.textDis : colors.textSec,
            }}
          >
            <span>Subtotal</span>
            <span style={{ textDecoration: discountCents > 0 ? 'line-through' : 'none' }}>
              {formatCurrency(subtotalCents)}
            </span>
          </div>

          {/* Discount row */}
          {discountCents > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                fontVariantNumeric: 'tabular-nums',
                color: colors.success,
              }}
            >
              <span>Discount ({promoResult?.code ?? ''})</span>
              <span>−{formatCurrency(discountCents)}</span>
            </div>
          )}

          {/* Discounted subtotal when promo is active */}
          {discountCents > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                fontVariantNumeric: 'tabular-nums',
                color: colors.textSec,
              }}
            >
              <span>After discount</span>
              <span>{formatCurrency(discountedSubtotal)}</span>
            </div>
          )}

          {/* HOF fee */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              fontVariantNumeric: 'tabular-nums',
              color: colors.textSec,
            }}
          >
            <span>Service fee</span>
            <span>{formatCurrency(feeCents)}</span>
          </div>

          {/* Total */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0 0',
              marginTop: 4,
              borderTop: `1px solid ${colors.border}`,
              fontFamily: 'Clash Display',
              fontSize: 16,
              fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
              color: colors.amber,
            }}
          >
            <span>Total</span>
            <span>{formatCurrency(displayTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment element */}
      <div style={{ padding: '0 16px' }}>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 11,
            color: colors.textSec,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginBottom: 12,
            marginTop: 4,
          }}
        >
          Payment
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: colors.textSec, marginBottom: 16 }}>
          Payments secured by Stripe. 256-bit SSL encryption.
        </div>
        <PaymentElement />
        {err && (
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: colors.error, marginTop: 12 }}>
            {err}
          </div>
        )}
        <div style={{ marginTop: 16, paddingBottom: 4 }}>
          <button
            className="hof-btn hof-press"
            onClick={() => {
              void handleConfirm();
            }}
            disabled={confirming || !stripe}
            style={{
              width: '100%',
              padding: '15px',
              background: confirming ? colors.elevated : colors.amber,
              border: 'none',
              borderRadius: 12,
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: 16,
              color: confirming ? colors.textSec : colors.bg,
              transition: 'background 150ms',
            }}
          >
            {confirming ? 'Processing…' : `Pay ${formatCurrency(intentAmount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepPayment({
  paymentIntentId,
  clientSecret,
  intentAmount,
  subtotalCents,
  discountCents,
  feeCents,
  promoResult,
  setPromoResult,
  promoCode,
  setPromoCode,
  promoLoading,
  onApplyPromo,
  onClearPromo,
  onSuccess,
}: {
  paymentIntentId: string;
  clientSecret: string;
  intentAmount: number;
  subtotalCents: number;
  discountCents: number;
  feeCents: number;
  promoResult: PromoResult | null;
  setPromoResult: (r: PromoResult | null) => void;
  promoCode: string;
  setPromoCode: (v: string) => void;
  promoLoading: boolean;
  onApplyPromo: () => void;
  onClearPromo: () => void;
  onSuccess: () => void;
}) {
  if (!clientSecret) {
    return (
      <div
        style={{
          padding: '40px 16px',
          textAlign: 'center',
          fontFamily: 'Inter',
          fontSize: 14,
          color: colors.textSec,
        }}
      >
        Preparing payment…
      </div>
    );
  }
  return (
    <Elements
      key={clientSecret}
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#E8651A',
            colorBackground: '#141412',
            colorText: '#F0EDE6',
            borderRadius: '8px',
          },
        },
      }}
    >
      <StepPaymentInner
        paymentIntentId={paymentIntentId}
        clientSecret={clientSecret}
        intentAmount={intentAmount}
        subtotalCents={subtotalCents}
        discountCents={discountCents}
        feeCents={feeCents}
        promoResult={promoResult}
        setPromoResult={setPromoResult}
        promoCode={promoCode}
        setPromoCode={setPromoCode}
        promoLoading={promoLoading}
        onApplyPromo={onApplyPromo}
        onClearPromo={onClearPromo}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const router = useRouter();
  const { isWide } = useResponsive();
  const stackedStepLabels = useNarrowCheckoutSteps();
  const searchParams = useSearchParams();
  const tierParam = searchParams.get('tierId') ?? '';
  const qtyParam = parseInt(searchParams.get('qty') ?? '1', 10);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [qty, setQty] = useState(
    Number.isFinite(qtyParam) && qtyParam >= 1 && qtyParam <= 4 ? qtyParam : 1,
  );
  const [tier, setTier] = useState(() => {
    const draft = loadCheckoutDraft();
    return tierParam || draft?.tier || '';
  });
  const [accountMode, setAccountMode] = useState<'guest' | 'signup' | 'signin'>('guest');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [details, setDetails] = useState<Details>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zipCode: '',
    password: '',
  });
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [intentAmount, setIntentAmount] = useState(0);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const setField = (k: keyof Details, v: string) => setDetails((d) => ({ ...d, [k]: v }));

  const [tierData, setTierData] = useState<Record<string, TierData>>({});
  const [checkoutEvent, setCheckoutEvent] = useState<Pick<
    UpcomingEvent,
    'name' | 'date' | 'venue_name' | 'doors_open' | 'doors_close'
  > | null>(null);
  const [checkoutEventFull, setCheckoutEventFull] = useState<UpcomingEvent | null>(null);
  const [maxQtyCheckout, setMaxQtyCheckout] = useState(MAX_TICKETS_PER_ORDER);
  const [eventLoading, setEventLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/profile')
      .then(async (r) => {
        if (!r.ok) {
          if (!cancelled) setIsLoggedIn(false);
          return;
        }
        const d = (await r.json()) as { profile?: CheckoutProfile };
        if (cancelled || !d.profile) return;
        setIsLoggedIn(true);
        setAccountMode('guest');
        const prefilled = detailsFromProfile(d.profile);
        setDetails((prev) => ({
          ...prev,
          firstName: prev.firstName || prefilled.firstName || '',
          lastName: prev.lastName || prefilled.lastName || '',
          email: prev.email || prefilled.email || '',
          phone: prev.phone || prefilled.phone || '',
        }));
      })
      .catch(() => {
        if (!cancelled) setIsLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetch('/api/events/upcoming')
      .then((r) => r.json())
      .then((d: { event?: UpcomingEvent }) => {
        if (d.event) {
          setCheckoutEventFull(d.event);
          setCheckoutEvent({
            name: d.event.name,
            date: d.event.date,
            venue_name: d.event.venue_name,
            doors_open: d.event.doors_open,
            doors_close: d.event.doors_close,
          });
          const userRemaining = d.event.user_tickets_remaining ?? MAX_TICKETS_PER_ORDER;
          setMaxQtyCheckout(Math.min(MAX_TICKETS_PER_ORDER, Math.max(1, userRemaining)));
        }
        if (!d.event?.ticket_tiers) return;
        const built: Record<string, TierData> = {};
        for (const t of d.event.ticket_tiers) {
          if (t.status === 'hidden') continue;
          const effective = t.effective_status ?? t.status;
          const remaining = t.remaining ?? Math.max(0, t.capacity - (t.sold ?? 0));
          const soldOut = effective === 'sold_out' || remaining <= 0;
          const tierName = t.display_name || t.name;
          built[t.id] = {
            name: tierName,
            priceCents: t.price_cents,
            feeCents: t.fee_cents ?? 0,
            description: t.description ?? null,
            remaining,
            soldOut,
          };
        }
        setTierData(built);
      })
      .catch(console.error)
      .finally(() => setEventLoading(false));
  }, []);

  useEventInventory({
    event: checkoutEventFull,
    onEventChange: (next) => {
      setCheckoutEventFull(next);
      if (!next.ticket_tiers) return;
      const built: Record<string, TierData> = {};
      for (const t of next.ticket_tiers) {
        if (t.status === 'hidden') continue;
        const effective = t.effective_status ?? t.status;
        const remaining = t.remaining ?? Math.max(0, t.capacity - (t.sold ?? 0));
        const soldOut = effective === 'sold_out' || remaining <= 0;
        const tierName = t.display_name || t.name;
        built[t.id] = {
          name: tierName,
          priceCents: t.price_cents,
          feeCents: t.fee_cents ?? 0,
          description: t.description ?? null,
          remaining,
          soldOut,
        };
      }
      setTierData(built);
    },
    enabled: !eventLoading,
    pollIntervalMs: INVENTORY_POLL_MS.checkout,
  });

  // Ensure selected tier is a valid API tier id (UUID), not a stale slug
  useEffect(() => {
    const keys = Object.keys(tierData).filter((id) => !tierData[id]?.soldOut);
    if (keys.length === 0) return;
    if (tier && tierData[tier] && !tierData[tier].soldOut) return;
    const fromParam =
      tierParam && tierData[tierParam] && !tierData[tierParam].soldOut ? tierParam : undefined;
    const next = fromParam ?? keys[0];
    if (next) setTier(next);
  }, [tierData, tier, tierParam]);

  useEffect(() => {
    const current = tierData[tier];
    if (!current) return;
    const tierCap = Math.min(maxQtyCheckout, current.remaining || maxQtyCheckout);
    if (qty > tierCap) setQty(Math.max(1, tierCap));
  }, [tier, tierData, maxQtyCheckout, qty]);

  useEffect(() => {
    if (tier) saveCheckoutDraft({ tier, qty });
  }, [tier, qty]);

  useEffect(() => {
    if (!tier) return;
    const currentTierId = searchParams.get('tierId');
    const currentQty = searchParams.get('qty');
    if (currentTierId === tier && (currentQty ?? '1') === String(qty)) return;
    const params = new URLSearchParams();
    params.set('tierId', tier);
    if (qty > 1) params.set('qty', String(qty));
    router.replace(`/checkout?${params.toString()}`, { scroll: false });
  }, [tier, qty, router, searchParams]);

  // Reset promo when tier or quantity changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: clear promo when tier/qty change
  useEffect(() => {
    setPromoResult(null);
  }, [tier, qty]);

  const currentTier = tierData[tier] ?? Object.values(tierData).find((t) => t && !t.soldOut);
  const tierMaxQty = currentTier
    ? Math.min(maxQtyCheckout, currentTier.remaining || maxQtyCheckout)
    : maxQtyCheckout;

  const checkoutAmounts = currentTier
    ? computeCheckoutAmounts({
        priceCents: currentTier.priceCents,
        feeCents: currentTier.feeCents,
        quantity: qty,
        discountCents: promoResult?.valid ? (promoResult.discountCents ?? 0) : 0,
      })
    : null;

  const subtotalCents = checkoutAmounts?.subtotalCents ?? 0;
  const discountCents = checkoutAmounts?.discountCents ?? 0;
  const feeCents = checkoutAmounts?.feeCents ?? 0;
  const displayTotalCents = checkoutAmounts?.totalCents ?? 0;
  const subtotal = subtotalCents / 100;
  const fees = feeCents / 100;
  const total = displayTotalCents / 100;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim());
  const phoneDigits = details.phone.replace(/\D/g, '');
  const phoneOk = phoneDigits.length >= 10;
  const zipOk = isValidZipCode(details.zipCode);
  const nameOk = details.firstName.trim().length >= 1 && details.lastName.trim().length >= 1;
  const passwordOk = accountMode !== 'signup' || details.password.length >= 6;
  const checkoutReturn = useMemo(() => {
    const params = new URLSearchParams();
    if (tier) params.set('tierId', tier);
    if (qty > 1) params.set('qty', String(qty));
    const qs = params.toString();
    return qs ? `/checkout?${qs}` : '/checkout';
  }, [tier, qty]);

  const step2Valid =
    accountMode === 'signin'
      ? isLoggedIn && emailOk
      : nameOk && emailOk && phoneOk && zipOk && (isLoggedIn || passwordOk);

  async function syncPaymentIntent(opts?: { codeId?: string; promoCode?: string }) {
    setPayLoading(true);
    setPayError('');
    try {
      const r = await fetch('/api/checkout/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: tier,
          quantity: qty,
          codeId: opts?.codeId,
          promoCode: opts?.promoCode,
          paymentIntentId: paymentIntentId || undefined,
        }),
      });
      const d = (await r.json()) as {
        clientSecret?: string;
        paymentIntentId?: string;
        amount?: number;
        error?: string;
      };
      if (!r.ok || !d.clientSecret || !d.paymentIntentId) {
        setPayError(d.error ?? 'Could not update payment amount');
        return false;
      }
      setClientSecret(d.clientSecret);
      setPaymentIntentId(d.paymentIntentId);
      setIntentAmount(d.amount ?? 0);
      return true;
    } catch {
      setPayError('Network error updating payment');
      return false;
    } finally {
      setPayLoading(false);
    }
  }

  async function applyPromoCode() {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoResult(null);
    setPayError('');
    try {
      const r = await fetch('/api/checkout/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          tierId: tier,
          subtotalCents,
        }),
      });
      const d = (await r.json()) as PromoResult;
      if (!d.valid) {
        setPromoResult(d);
        return;
      }
      setPromoResult(d);
      setPromoCode(d.code ?? code);
      if (step === 3) {
        const synced = await syncPaymentIntent({
          codeId: d.codeId,
          promoCode: d.code ?? code,
        });
        if (!synced) {
          setPromoResult({
            valid: false,
            error: 'Code is valid but payment could not be updated. Try again.',
          });
        }
      }
    } catch {
      setPromoResult({ valid: false, error: 'Could not validate code' });
    } finally {
      setPromoLoading(false);
    }
  }

  async function clearPromoCode() {
    setPromoResult(null);
    setPromoCode('');
    setPayError('');
    if (step === 3 && paymentIntentId) {
      await syncPaymentIntent();
    }
  }

  async function handleAdvance() {
    if (step < 3) {
      if (step === 2) {
        setPayLoading(true);
        setPayError('');
        try {
          const r = await fetch('/api/checkout/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tierId: tier,
              quantity: qty,
              codeId: promoResult?.valid ? promoResult.codeId : undefined,
              discountCents: promoResult?.valid ? promoResult.discountCents : 0,
              buyerEmail: details.email.trim(),
              buyerFirstName: details.firstName.trim(),
              buyerLastName: details.lastName.trim(),
              buyerPhone: details.phone.trim(),
              buyerZipCode: details.zipCode.trim(),
            }),
          });
          const d = (await r.json()) as {
            clientSecret?: string;
            paymentIntentId?: string;
            amount?: number;
            error?: string;
          };
          if (d.error || !d.clientSecret || !d.paymentIntentId) {
            setPayError(d.error ?? 'Could not create payment. Please sign in.');
            setPayLoading(false);
            return;
          }
          setClientSecret(d.clientSecret);
          setPaymentIntentId(d.paymentIntentId);
          setIntentAmount(d.amount ?? 0);
        } catch {
          setPayError('Network error. Please try again.');
          setPayLoading(false);
          return;
        }
        setPayLoading(false);
      }
      setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
      return;
    }
    // Step 3: payment is handled by StepPaymentInner
  }

  const stepNames = ['Tickets', 'Your details', 'Payment'];

  const handleCheckoutBack = useCallback(() => {
    if (step === 1) router.back();
    else setStep((step - 1) as 1 | 2 | 3);
  }, [step, router]);

  useAppHeader({ title: 'Checkout', onBack: handleCheckoutBack, hideMobileHeader: true });

  // Display total for the sticky CTA bar (uses discounted total on step 3, base total elsewhere)
  const ctaTotal = step === 3 ? displayTotalCents / 100 : total;

  const contentInsetX = 16;
  const scrollPaddingTop = isWide
    ? layoutChrome.wideActionsInset
    : `calc(${layoutChrome.mobilePageHeaderInset} + 12px)`;
  const scrollPaddingBottom =
    step === 3
      ? 'calc(28px + max(10px, env(safe-area-inset-bottom, 0px)))'
      : `calc(${layoutChrome.mobileCheckoutCtaHeight}px + max(10px, env(safe-area-inset-bottom, 0px)))`;

  if (!eventLoading && !checkoutEvent) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: colors.bg,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!isWide ? <HofMobilePageHeader title="Checkout" onBack={handleCheckoutBack} /> : null}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState
            icon="ticket"
            title={NO_EVENTS_MESSAGE}
            action={
              <button
                className="hof-btn hof-press"
                onClick={() => router.push('/event')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  background: colors.amber,
                  border: `1px solid ${colors.amber}`,
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: 14,
                  color: colors.bg,
                }}
              >
                View events
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: colors.bg,
        overflow: 'hidden',
      }}
    >
      {!isWide ? <HofMobilePageHeader title="Checkout" onBack={handleCheckoutBack} /> : null}
      {/* Scrollable content */}
      <div
        className="hof-scroll"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: isWide ? '50%' : 0,
          right: isWide ? 'auto' : 0,
          transform: isWide ? 'translateX(-50%)' : undefined,
          width: isWide ? 'min(100%, 760px)' : 'auto',
          overflowY: 'auto',
          paddingTop: scrollPaddingTop,
          paddingBottom: scrollPaddingBottom,
          boxSizing: 'border-box',
        }}
      >
        {/* Step indicator */}
        <div
          style={{
            padding: `8px ${contentInsetX}px 28px`,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <CheckoutStepIndicator
            step={step}
            stepNames={stepNames}
            stackedLabels={stackedStepLabels}
          />
        </div>

        {/* Summary chip */}
        <div
          style={{
            padding: `0 ${contentInsetX}px 16px`,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px 16px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="flame" size={16} color={colors.amber} />
              <div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: 12,
                    color: colors.text,
                  }}
                >
                  {checkoutEvent
                    ? `${checkoutEvent.name} — ${formatEventDateShort(checkoutEvent.date)}`
                    : 'Loading event…'}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 11,
                    color: colors.textSec,
                  }}
                >
                  {checkoutEvent?.venue_name ?? '—'}
                  {checkoutEvent?.doors_open
                    ? ` · Doors ${formatDoorsRange(checkoutEvent.doors_open, checkoutEvent.doors_close)}`
                    : ''}
                </div>
              </div>
            </div>
            <div
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 13,
                color: colors.text,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ${ctaTotal.toFixed(2)}
            </div>
          </div>
        </div>

        {step === 1 && (
          <StepTickets
            tier={tier}
            setTier={setTier}
            qty={qty}
            setQty={setQty}
            tierData={tierData}
            subtotal={subtotal}
            fees={fees}
            maxQty={tierMaxQty}
            maxPerOrder={MAX_TICKETS_PER_ORDER}
          />
        )}
        {step === 2 && (
          <StepAccount
            mode={accountMode}
            setMode={setAccountMode}
            details={details}
            setField={setField}
            errors={{
              email: details.email.length > 0 ? !emailOk : undefined,
              phone: details.phone.length > 0 ? !phoneOk : undefined,
              zipCode: details.zipCode.length > 0 ? !zipOk : undefined,
            }}
            isLoggedIn={isLoggedIn}
            checkoutReturn={checkoutReturn}
          />
        )}
        {step === 3 && (
          <StepPayment
            paymentIntentId={paymentIntentId}
            clientSecret={clientSecret}
            intentAmount={intentAmount}
            subtotalCents={subtotalCents}
            discountCents={discountCents}
            feeCents={feeCents}
            promoResult={promoResult}
            setPromoResult={setPromoResult}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            promoLoading={promoLoading}
            onApplyPromo={() => {
              void applyPromoCode();
            }}
            onClearPromo={() => {
              void clearPromoCode();
            }}
            onSuccess={() => router.push('/ticket?purchased=1')}
          />
        )}

        <div style={{ height: step === 3 ? 12 : 8, flexShrink: 0 }} aria-hidden="true" />
      </div>

      {/* Sticky CTA — hidden on step 3 (payment is handled inside Stripe Elements) */}
      {step !== 3 && (
        <div
          className="hof-no-print"
          style={{
            position: 'absolute',
            left: isWide ? '50%' : 0,
            right: isWide ? 'auto' : 0,
            bottom: 0,
            transform: isWide ? 'translateX(-50%)' : undefined,
            width: isWide ? 'min(100%, 760px)' : 'auto',
            boxSizing: 'border-box',
            zIndex: 45,
            background: 'rgba(10,10,8,0.92)',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
            borderTop: `1px solid ${colors.border}`,
            padding: `14px ${contentInsetX}px calc(12px + max(10px, env(safe-area-inset-bottom, 0px)))`,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: 'Inter',
                fontSize: 12,
                color: colors.textSec,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              Total · {qty} {qty === 1 ? 'ticket' : 'tickets'}
            </span>
            <span
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 22,
                color: colors.text,
                letterSpacing: '-0.01em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ${total.toFixed(2)}
            </span>
          </div>
          {payError && (
            <div
              style={{ fontFamily: 'Inter', fontSize: 13, color: colors.error, marginBottom: 8 }}
            >
              {payError}
            </div>
          )}
          <button
            className="hof-btn hof-press"
            disabled={(step === 2 && !step2Valid) || payLoading}
            onClick={() => {
              void handleAdvance();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '15px',
              background:
                (step === 2 && !step2Valid) || payLoading ? colors.elevated : colors.amber,
              border: `1px solid ${(step === 2 && !step2Valid) || payLoading ? colors.border : colors.amber}`,
              borderRadius: 12,
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: 16,
              color: (step === 2 && !step2Valid) || payLoading ? colors.textDis : colors.bg,
              opacity: (step === 2 && !step2Valid) || payLoading ? 0.6 : 1,
            }}
          >
            {step === 1 && 'Continue to your details'}
            {step === 2 &&
              (payLoading
                ? 'Preparing…'
                : step2Valid
                  ? 'Continue to payment'
                  : 'Fill in your details')}
          </button>
        </div>
      )}
    </div>
  );
}
