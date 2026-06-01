'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation.js';
import type { Database } from '@/lib/database.types.js';

function getBrowserClient() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? 'https://placeholder.supabase.co';
  const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? 'placeholder-anon-key';
  return createClient<Database>(url, key);
}

export default function UnauthorizedPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--hof-bg)',
    }}>
      <div style={{
        width: 400, padding: 40, textAlign: 'center',
        background: 'var(--hof-surface)', border: '1px solid var(--hof-border)', borderRadius: 14,
      }}>
        <div style={{
          width: 64, height: 64, margin: '0 auto 20px', borderRadius: 32,
          background: 'rgba(232,74,26,0.12)', border: '1px solid rgba(232,74,26,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path stroke="var(--hof-error)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <div style={{
          fontFamily: 'Clash Display, system-ui', fontWeight: 600, fontSize: 24,
          color: 'var(--hof-text)', letterSpacing: '-0.01em',
        }}>Admin access required</div>
        <div style={{
          fontFamily: 'Inter, system-ui', fontSize: 14, color: 'var(--hof-text-sec)',
          marginTop: 10, lineHeight: 1.5,
        }}>
          Your account does not have admin or crew access to this console.
          Contact Jordan if you think this is a mistake.
        </div>
        <button
          onClick={() => { void handleSignOut(); }}
          style={{
            marginTop: 24, padding: '12px 24px',
            background: 'var(--hof-elevated)', border: '1px solid var(--hof-border)',
            borderRadius: 8, cursor: 'pointer',
            fontFamily: 'Inter, system-ui', fontSize: 14, fontWeight: 500,
            color: 'var(--hof-text)',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
