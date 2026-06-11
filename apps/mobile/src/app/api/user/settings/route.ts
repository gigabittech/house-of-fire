import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase.server';

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const patch = (await request.json()) as Record<string, unknown>;

  const { data: current, error: readError } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', user.id)
    .single();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  const existing =
    typeof current?.settings === 'object' && current.settings && !Array.isArray(current.settings)
      ? (current.settings as Record<string, unknown>)
      : {};
  const settings = { ...existing, ...patch };

  const { data, error } = await supabase
    .from('profiles')
    .update({ settings })
    .eq('id', user.id)
    .select('settings')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data.settings });
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data?.settings ?? {} });
}
