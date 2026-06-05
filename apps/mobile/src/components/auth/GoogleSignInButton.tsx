'use client';

import { colors } from '@hof/design-tokens';
import { HofButton, Icon } from '@hof/ui';
import { useState } from 'react';
import { createClient } from '../../lib/supabase';
import { type GoogleAuthFlow, signInWithGoogle } from '../../lib/auth/googleOAuth';

export function GoogleSignInButton({
  flow,
  next,
  disabled,
}: {
  flow: GoogleAuthFlow;
  next: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: authError } = await signInWithGoogle({
      supabase,
      origin: window.location.origin,
      flow,
      next,
    });
    if (authError) {
      setError(authError);
      setLoading(false);
    }
  }

  return (
    <div>
      <HofButton
        variant="quiet"
        full
        size="lg"
        disabled={disabled || loading}
        icon={<Icon name="google" size={18} color={colors.text} />}
        onClick={() => {
          void handleClick();
        }}
      >
        {loading ? 'Redirecting to Google…' : 'Continue with Google'}
      </HofButton>
      {error ? (
        <div
          style={{
            marginTop: 10,
            fontFamily: 'Inter',
            fontSize: 12,
            color: '#f87171',
            lineHeight: 1.45,
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
