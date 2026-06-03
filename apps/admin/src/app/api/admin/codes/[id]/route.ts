import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../../../lib/supabase.admin';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from('discount_codes').update({ active: false }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
