import { type NextRequest, NextResponse } from 'next/server';
import { resend } from '../../../../lib/resend';
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from '../../../../lib/supabase.server';

async function requireAdminOrCrew(_request: NextRequest) {
  // createServerSupabaseClient reads the session cookie to identify the user
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'crew')) return null;

  return user;
}

// GET — list waitlist entries for a given event
export async function GET(request: NextRequest) {
  const authed = await requireAdminOrCrew(request);
  if (!authed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const eventId = request.nextUrl.searchParams.get('eventId');
  if (!eventId) {
    return NextResponse.json({ error: 'eventId query param required' }, { status: 400 });
  }

  // Use service-role client so the "using (false)" select policy is bypassed
  const admin = await createServiceRoleClient();

  const { data: waitlistEntries, error } = await admin
    .from('waitlist')
    .select('*')
    .eq('event_id', eventId)
    .order('position', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ waitlist: waitlistEntries ?? [] });
}

// POST — notify the next person on the waitlist
export async function POST(request: NextRequest) {
  const authed = await requireAdminOrCrew(request);
  if (!authed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as { eventId?: string };
  const { eventId } = body;

  if (!eventId) {
    return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
  }

  const admin = await createServiceRoleClient();

  // Get event details for the email
  const { data: event, error: eventError } = await admin
    .from('events')
    .select('name, edition_number')
    .eq('id', eventId)
    .single();

  if (eventError ?? !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Find the first un-notified entry
  const { data: entry, error: entryError } = await admin
    .from('waitlist')
    .select('*')
    .eq('event_id', eventId)
    .is('notified_at', null)
    .order('position', { ascending: true })
    .limit(1)
    .single();

  if (entryError ?? !entry) {
    return NextResponse.json({ error: 'No un-notified waitlist entries found' }, { status: 404 });
  }

  const edStr = String(event.edition_number).padStart(2, '0');
  const eventPageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://houseoffire.live'}/events/${eventId}`;

  // Send notification email via Resend
  const emailHtml =
    `<p>A spot just opened up for <strong>${event.name}</strong> (House of Fire Edition ${edStr}).</p>` +
    `<p><a href="${eventPageUrl}">Grab your ticket before it is gone &rarr;</a></p>` +
    `<p>See you on the dance floor,<br/>House of Fire</p>`;
  await resend.emails.send({
    html: emailHtml,
    from: 'House of Fire <noreply@houseoffire.live>',
    to: entry.email,
    subject: `A spot just opened — House of Fire Ed ${edStr}`,
    text: [
      `Hey${entry.name ? ` ${entry.name}` : ''},`,
      '',
      `A spot just opened up for ${event.name} (House of Fire Edition ${edStr}).`,
      '',
      "Grab your ticket before it's gone:",
      eventPageUrl,
      '',
      'See you on the dance floor,',
      'House of Fire',
    ].join('\n'),
  });

  // Mark the entry as notified
  const { error: updateError } = await admin
    .from('waitlist')
    .update({ notified_at: new Date().toISOString() })
    .eq('id', entry.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    notified: { email: entry.email, position: entry.position },
  });
}
