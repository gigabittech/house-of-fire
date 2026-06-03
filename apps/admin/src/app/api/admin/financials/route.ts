import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

export async function GET() {
  const supabase = createAdminSupabaseClient();

  // Fetch all events ordered by edition
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, edition_number, name, date, status')
    .order('edition_number', { ascending: false });

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  // Fetch tickets to aggregate revenue per event
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('event_id, amount_cents, fee_cents, status')
    .in('status', ['valid', 'used']);

  if (ticketsError) {
    return NextResponse.json({ error: ticketsError.message }, { status: 500 });
  }

  // Aggregate revenue by event_id
  const revenueByEvent: Record<string, { gross_cents: number; ticket_count: number }> = {};
  for (const ticket of tickets ?? []) {
    const existing = revenueByEvent[ticket.event_id] ?? { gross_cents: 0, ticket_count: 0 };
    revenueByEvent[ticket.event_id] = {
      gross_cents: existing.gross_cents + ticket.amount_cents,
      ticket_count: existing.ticket_count + 1,
    };
  }

  const summary = (events ?? []).map((ev) => {
    const revenue = revenueByEvent[ev.id] ?? { gross_cents: 0, ticket_count: 0 };
    return {
      event_id: ev.id,
      edition_number: ev.edition_number,
      name: ev.name,
      date: ev.date,
      status: ev.status,
      gross_cents: revenue.gross_cents,
      ticket_count: revenue.ticket_count,
    };
  });

  return NextResponse.json({ financials: summary });
}
