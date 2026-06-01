import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server.js';
import { createServerSupabaseClient } from '../../../lib/supabase.server.js';
import type { Database } from '../../../lib/database.types.js';

/**
 * DEV-ONLY one-click role impersonation for the admin panel.
 *
 * /dev/login?role=crew|admin provisions a fixed test user, forces its role,
 * signs in, and writes the Supabase auth cookies — landing you in the admin
 * dashboard. `member` is allowed too, but the admin middleware will bounce it
 * to /unauthorized (useful for demonstrating the role gate).
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
  if (process.env['NODE_ENV'] === 'production') {
    return NextResponse.json({ error: 'Dev login is disabled in production' }, { status: 403 });
  }

  const { searchParams, origin } = new URL(request.url);
  const role = (searchParams.get('role') ?? 'admin') as Role;
  const next = searchParams.get('next') ?? '/dashboard';
  const creds = ROLES[role];
  if (!creds) {
    return NextResponse.json({ error: `Invalid role. Use one of: ${Object.keys(ROLES).join(', ')}` }, { status: 400 });
  }

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
  }

  const admin = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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

  await admin.from('profiles').upsert(
    { id: userId, handle: role, display_name: creds.name, role },
    { onConflict: 'id' },
  );

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
