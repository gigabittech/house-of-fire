import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../../../lib/database.types';
import { resend } from '../../../../../lib/resend';
import { createServerSupabaseClient } from '../../../../../lib/supabase.server';

type TicketRow = Database['public']['Tables']['tickets']['Row'];
type EventRow = Database['public']['Tables']['events']['Row'];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { toEmail } = (await request.json()) as { toEmail: string };
  if (!toEmail) return NextResponse.json({ error: 'toEmail required' }, { status: 400 });

  // Verify ticket belongs to user and is valid
  const { data: ticketData } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .eq('holder_id', user.id)
    .eq('status', 'valid')
    .single();

  if (!ticketData)
    return NextResponse.json({ error: 'Ticket not found or not transferable' }, { status: 404 });
  const ticket = ticketData as TicketRow;

  // Get event for edition number
  const { data: eventData } = await supabase
    .from('events')
    .select('edition_number')
    .eq('id', ticket.event_id)
    .single();
  const ev = eventData as Pick<EventRow, 'edition_number'> | null;

  // Guard against duplicate pending transfers for this ticket
  const { data: existingTransfer } = await supabase
    .from('ticket_transfers')
    .select('id')
    .eq('ticket_id', id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingTransfer) {
    return NextResponse.json(
      { error: 'A pending transfer already exists for this ticket' },
      { status: 409 },
    );
  }

  // Check if recipient is already a user (match by handle = email)
  const { data: recipient } = await supabase
    .from('profiles')
    .select('id')
    .eq('handle', toEmail)
    .single();

  const { data: transfer, error } = await supabase
    .from('ticket_transfers')
    .insert({
      ticket_id: id,
      from_user_id: user.id,
      to_email: toEmail,
      to_user_id: recipient?.id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark ticket as transferred
  await supabase.from('tickets').update({ status: 'transferred' }).eq('id', id);

  // Notify the sender that the transfer was initiated
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'ticket_transferred',
    title: 'Ticket transfer sent',
    body: 'Your ticket for Edition ' + (ev?.edition_number ?? '?') + ' was sent to ' + toEmail,
    link: '/ticket',
  });

  // Send email notification to recipient
  const { data: sender } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const transferId = (transfer as { id: string }).id;
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://houseoffire.events'}/accept-transfer?id=${transferId}`;

  await resend.emails
    .send({
      from: process.env.RESEND_FROM_EMAIL ?? 'House of Fire <tickets@houseoffire.club>',
      to: toEmail,
      subject: 'You received a ticket transfer',
      html: `
        <div style="background:#0A0A08;color:#F0EDE6;font-family:Inter,sans-serif;padding:40px;max-width:480px;margin:0 auto;border-radius:12px;">
          <h1 style="color:#E8651A;margin-top:0;">You received a ticket.</h1>
          <p style="font-size:16px;line-height:1.5;">
            ${sender?.display_name ?? 'A friend'} transferred their ticket to House of Fire
            Edition ${ev?.edition_number ?? '?'} to you.
          </p>
          <p style="font-size:14px;color:#8A8880;line-height:1.5;">
            To accept and claim your ticket, click the link below. The offer expires in 24 hours.
          </p>
          <a href="${acceptUrl}" style="
            display:inline-block;margin-top:24px;padding:14px 28px;
            background:#E8651A;color:#F0EDE6;text-decoration:none;
            font-weight:600;border-radius:8px;font-size:15px;
          ">Accept transfer</a>
          <p style="margin-top:32px;font-size:12px;color:#555350;">
            Or copy this link into your browser:<br/>
            <span style="color:#8A8880;word-break:break-all;">${acceptUrl}</span>
          </p>
          <hr style="border:none;border-top:1px solid #222220;margin:32px 0;"/>
          <p style="font-size:11px;color:#555350;margin:0;">
            House of Fire · houseoffire.events
          </p>
        </div>
      `,
    })
    .catch(console.error);

  return NextResponse.json({ transfer }, { status: 201 });
}
