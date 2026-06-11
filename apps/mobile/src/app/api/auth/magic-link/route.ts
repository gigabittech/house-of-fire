import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createEmailLog, updateEmailLog } from '../../../../lib/emailLog.server';
import type { Database } from '../../../../lib/database.types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

type MagicLinkFlow = 'sign_in' | 'sign_up';

function subjectForFlow(flow: MagicLinkFlow): string {
  return flow === 'sign_in'
    ? 'House of Fire — Sign in magic link'
    : 'House of Fire — Confirm your email';
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email?: string;
    flow?: MagicLinkFlow;
    redirectTo?: string;
    userData?: {
      first_name?: string;
      last_name?: string;
      display_name?: string;
      phone?: string;
    };
  };

  const email = body.email?.trim().toLowerCase() ?? '';
  const flow = body.flow ?? 'sign_in';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  if (flow !== 'sign_in' && flow !== 'sign_up') {
    return NextResponse.json({ error: 'Invalid flow' }, { status: 400 });
  }

  const origin =
    request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectTo =
    body.redirectTo?.trim() || `${origin}/auth/callback/client?next=${encodeURIComponent('/')}`;

  let logId: string | undefined;
  try {
    logId = await createEmailLog({
      app: 'mobile',
      kind: 'auth_magic_link',
      toAddress: email,
      subject: subjectForFlow(flow),
      fromEmail: process.env.RESEND_FROM_EMAIL ?? null,
      provider: 'supabase_auth',
      status: 'queued',
      meta: { flow, ...(body.userData ?? {}) },
    });
  } catch (err) {
    console.error('[email_log] auth magic link create failed:', err);
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: authErr } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      ...(flow === 'sign_in' ? { shouldCreateUser: false } : {}),
      ...(flow === 'sign_up' && body.userData ? { data: body.userData } : {}),
    },
  });

  if (authErr) {
    if (logId) {
      try {
        await updateEmailLog(logId, {
          status: 'failed',
          errorMessage: authErr.message,
        });
      } catch (err) {
        console.error('[email_log] auth magic link mark failed:', err);
      }
    }
    return NextResponse.json({ error: authErr.message }, { status: 400 });
  }

  if (logId) {
    try {
      await updateEmailLog(logId, {
        status: 'sent',
        sentAt: new Date(),
        errorMessage: null,
      });
    } catch (err) {
      console.error('[email_log] auth magic link mark sent:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
