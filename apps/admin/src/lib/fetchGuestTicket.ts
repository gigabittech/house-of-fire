import type { AdminGuestTicket } from '@/lib/guestTicket';

/** Fetch one guest ticket by id (joins profile, tier, event, order). */
export async function fetchAdminGuestByTicketId(
  ticketId: string,
): Promise<AdminGuestTicket | null> {
  try {
    const res = await fetch(`/api/admin/guests?ticketId=${encodeURIComponent(ticketId)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { guests?: AdminGuestTicket[] };
    return data.guests?.[0] ?? null;
  } catch {
    return null;
  }
}
