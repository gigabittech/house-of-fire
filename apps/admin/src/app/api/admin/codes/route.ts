import { NextResponse, type NextRequest } from 'next/server.js';
import { createAdminSupabaseClient } from '../../../../lib/supabase.admin.js';

export async function GET() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ codes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabaseClient();
  const body = (await request.json()) as {
    code: string;
    kind: string;
    value: number;
    max_uses?: number | null;
    event_id?: string | null;
    expires_at?: string | null;
    note?: string | null;
  };

  const code = body.code?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('discount_codes')
    .insert({
      code,
      kind: body.kind ?? 'percent',
      value: body.value,
      max_uses: body.max_uses ?? null,
      event_id: body.event_id ?? null,
      expires_at: body.expires_at ?? null,
      note: body.note ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code: data }, { status: 201 });
}
