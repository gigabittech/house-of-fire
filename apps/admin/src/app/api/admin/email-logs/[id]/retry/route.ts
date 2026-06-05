import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { resend } from '@/lib/resend';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

function metaRecord(meta: unknown): Record<string, unknown> {
  return typeof meta === 'object' && meta && !Array.isArray(meta) ? (meta as Record<string, unknown>) : {};
}

async function retryAuthMagicLink(row: {
  id: string;
  to_address: string;
  meta: unknown;
}): Promise<void> {
  const meta = metaRecord(row.meta);
  const flow = meta.flow === 'sign_up' ? 'sign_up' : 'sign_in';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectTo = `${appUrl}/auth/callback/client?next=${encodeURIComponent('/')}`;

  const { updateEmailLog } = await import('@/lib/emailLog.server');
  await updateEmailLog(row.id, { status: 'queued', errorMessage: null, sentAt: null });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userData =
    flow === 'sign_up'
      ? {
          first_name: typeof meta.first_name === 'string' ? meta.first_name : undefined,
          last_name: typeof meta.last_name === 'string' ? meta.last_name : undefined,
          display_name: typeof meta.display_name === 'string' ? meta.display_name : undefined,
          phone: typeof meta.phone === 'string' ? meta.phone : undefined,
        }
      : undefined;

  const { error } = await supabase.auth.signInWithOtp({
    email: row.to_address,
    options: {
      emailRedirectTo: redirectTo,
      ...(flow === 'sign_in' ? { shouldCreateUser: false } : {}),
      ...(userData ? { data: userData } : {}),
    },
  });

  if (error) {
    await updateEmailLog(row.id, { status: 'failed', errorMessage: error.message });
    throw new Error(error.message);
  }

  await updateEmailLog(row.id, { status: 'sent', sentAt: new Date(), errorMessage: null });
}

async function retryReceipt(row: { id: string; meta: unknown }): Promise<void> {
  const orderId = metaRecord(row.meta).orderId;
  if (typeof orderId !== 'string' || !orderId.trim()) {
    throw new Error('Receipt retry missing orderId in log metadata.');
  }

  const mobileUrl = process.env.MOBILE_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const res = await fetch(`${mobileUrl}/api/admin/retry-receipt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ orderId, logId: row.id }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Receipt resend failed (${res.status})`);
  }
}

export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const supabase = createAdminSupabaseClient();

  const { data: row, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? 'Email log not found' }, { status: 404 });
  }

  if (row.status !== 'failed') {
    return NextResponse.json({ error: 'Only failed emails can be resent' }, { status: 400 });
  }

  try {
    if (row.kind === 'auth_magic_link' || row.provider === 'supabase_auth') {
      await retryAuthMagicLink(row);
      return NextResponse.json({ ok: true, id: row.id });
    }

    if (row.kind === 'receipt') {
      await retryReceipt(row);
      return NextResponse.json({ ok: true, id: row.id });
    }

    const result = await resend.emails.send({
      from: row.from_email ?? undefined,
      to: row.to_address,
      subject: row.subject,
      html: row.html_body ?? '<p>(no html body)</p>',
      text: row.text_body ?? undefined,
      log: {
        existingLogId: row.id,
        kind: row.kind ?? undefined,
        projectId: row.project_id ?? undefined,
        meta: metaRecord(row.meta),
      },
    });
    return NextResponse.json({ ok: true, id: row.id, resendId: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
