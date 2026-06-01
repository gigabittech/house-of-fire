import { NextResponse, type NextRequest } from 'next/server.js';
import { createServerSupabaseClient } from '../../../../lib/supabase.server.js';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    endpoint?: string;
    p256dh?: string;
    auth?: string;
    platform?: string;
  };

  const { endpoint, p256dh, auth, platform } = body;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: 'endpoint, p256dh, and auth are required' },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth_key: auth,
      platform: platform ?? 'web',
    },
    { onConflict: 'user_id,endpoint' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
