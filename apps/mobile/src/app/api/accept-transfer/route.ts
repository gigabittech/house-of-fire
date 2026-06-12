import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../lib/database.types';
import { createServerSupabaseClient, createServiceRoleClient } from '../../../lib/supabase.server';

type TicketTransferRow = Database['public']['Tables']['ticket_transfers']['Row'];

interface TransferDetails {
  id: string;
  status: TicketTransferRow['status'];
  expires_at: string;
  to_email: string;
  ticket: {
    id: string;
    code: string;
    tier: {
      name: string;
      display_name: string;
    };
    event: {
      edition_number: number;
      name: string;
    };
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from('ticket_transfers')
    .select(
      `
      id,
      status,
      expires_at,
      to_email,
      ticket:tickets (
        id,
        code,
        tier:ticket_tiers (
          name,
          display_name
        ),
        event:events (
          edition_number,
          name
        )
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
  }

  return NextResponse.json({ transfer: data as unknown as TransferDetails });
}

export async function PATCH(request: NextRequest) {
  const { id } = (await request.json()) as { id: string };

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  // Auth check — user must be logged in to accept
  const authSupabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceRoleClient();

  // Fetch the transfer to verify it is still pending and not expired
  const { data: transfer, error: fetchError } = await supabase
    .from('ticket_transfers')
    .select('id, ticket_id, status, expires_at, to_email')
    .eq('id', id)
    .single();

  if (fetchError || !transfer) {
    return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
  }

  if (transfer.status !== 'pending') {
    return NextResponse.json({ error: `Transfer is already ${transfer.status}` }, { status: 409 });
  }

  // Bind acceptance to the invited email — knowing the transfer ID is not enough.
  const userEmail = user.email?.trim().toLowerCase() ?? '';
  if (!userEmail || transfer.to_email.trim().toLowerCase() !== userEmail) {
    return NextResponse.json(
      { error: 'This transfer was sent to a different email address' },
      { status: 403 },
    );
  }

  if (new Date(transfer.expires_at) < new Date()) {
    // Mark as expired
    await supabase.from('ticket_transfers').update({ status: 'expired' }).eq('id', id);
    return NextResponse.json({ error: 'Transfer has expired' }, { status: 410 });
  }

  // Update the ticket holder to the current user
  const { error: ticketError } = await supabase
    .from('tickets')
    .update({ holder_id: user.id, status: 'valid' })
    .eq('id', transfer.ticket_id);

  if (ticketError) {
    return NextResponse.json({ error: ticketError.message }, { status: 500 });
  }

  // Mark transfer as accepted
  const { error: transferError } = await supabase
    .from('ticket_transfers')
    .update({
      status: 'accepted',
      completed_at: new Date().toISOString(),
      to_user_id: user.id,
    })
    .eq('id', id);

  if (transferError) {
    return NextResponse.json({ error: transferError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ticketId: transfer.ticket_id });
}
