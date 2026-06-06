export type ProfileTicket = {
  id: string;
  code: string;
  status: string;
  purchased_at: string;
  amount_cents: number;
  fee_cents: number;
  used_at: string | null;
  events: {
    name: string;
    date: string;
    edition_number: number;
    venue_name: string;
    doors_open: string;
    doors_close?: string;
  } | null;
  ticket_tiers: { display_name: string; name: string } | null;
};

export type ProfileData = {
  handle: string;
  display_name: string;
  member_since: string;
  role: string;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  tickets_count: number;
  editions_attended: number;
};
