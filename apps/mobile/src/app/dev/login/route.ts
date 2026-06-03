import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../lib/database.types';
import { createServerSupabaseClient } from '../../../lib/supabase.server';

/**
 * DEV-ONLY one-click role impersonation.
 *
 * Hitting /dev/login?role=member|crew|admin provisions a fixed test user for
 * that role (idempotent), forces its profile.role, signs in with a known dev
 * password, and writes the Supabase auth cookies — so a single link logs you
 * straight into the member app as that role.
 *
 * Hard-disabled when NODE_ENV === 'production'.
 */

const ROLES = {
  member: { email: 'member@hof.test', name: 'Riley Member', password: 'hof-dev-member' },
  crew: { email: 'crew@hof.test', name: 'Casey Crew', password: 'hof-dev-crew' },
  admin: { email: 'admin@hof.test', name: 'Alex Admin', password: 'hof-dev-admin' },
} as const;

type Role = keyof typeof ROLES;

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Dev login is disabled in production' }, { status: 403 });
  }

  const { searchParams, origin } = new URL(request.url);
  const role = (searchParams.get('role') ?? 'member') as Role;
  const next = searchParams.get('next') ?? '/';
  const creds = ROLES[role];
  if (!creds) {
    return NextResponse.json(
      { error: `Invalid role. Use one of: ${Object.keys(ROLES).join(', ')}` },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
  }

  const admin = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Ensure the auth user exists (create-if-missing). The on_auth_user_created
  //    trigger auto-creates a matching profiles row.
  let userId: string | undefined;
  const { data: created } = await admin.auth.admin.createUser({
    email: creds.email,
    password: creds.password,
    email_confirm: true,
    user_metadata: { display_name: creds.name },
  });
  if (created?.user) {
    userId = created.user.id;
  } else {
    const { data: list } = await admin.auth.admin.listUsers();
    userId = list?.users.find((u) => u.email === creds.email)?.id;
  }
  if (!userId) {
    return NextResponse.json({ error: 'Could not provision test user' }, { status: 500 });
  }

  // 2. Upsert the profile with the right role. Upserting (not updating) means
  //    we don't depend on the on_auth_user_created trigger having run.
  await admin
    .from('profiles')
    .upsert({ id: userId, handle: role, display_name: creds.name, role }, { onConflict: 'id' });

  // 3. Sign in via the cookie-writing SSR client — establishes the session.
  const supabase = await createServerSupabaseClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: creds.email,
    password: creds.password,
  });
  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 500 });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
