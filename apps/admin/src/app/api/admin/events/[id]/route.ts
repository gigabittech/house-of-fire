import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import { parseEventPayload } from '@/lib/eventPayload';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

type EventUpdate = Database['public']['Tables']['events']['Update'];

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = createAdminSupabaseClient();

  const { data: event, error } = await supabase.from('events').select('*').eq('id', id).single();

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const { count: sold } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .in('status', ['valid', 'used']);

  return NextResponse.json({ event, sold: sold ?? 0 });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as unknown;
  const parsed = parseEventPayload(body, { partial: true });
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const updates = parsed.data as EventUpdate;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const supabase = createAdminSupabaseClient();

  const { count, error: countError } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .in('status', ['valid', 'used']);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete — ${count} ticket(s) sold. Set status to Cancelled instead.`,
        sold: count,
      },
      { status: 409 },
    );
  }

  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
