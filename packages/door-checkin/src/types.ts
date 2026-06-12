export type CachedGuestTicket = {
  code: string;
  status: string;
  checked_in_at: string | null;
  holder_name: string;
  tier_name: string;
};

export type GuestCachePayload = {
  eventId: string;
  fetchedAt: string;
  tickets: CachedGuestTicket[];
};

export type QueuedCheckIn = {
  client_scan_id: string;
  code: string;
  scanned_at: string;
  event_id?: string;
};

export type ScanApiSuccess = {
  ok?: boolean;
  outcome?: string;
  holder?: { display_name: string; handle?: string | null };
  tier?: { display_name: string; name: string } | null;
  code?: string;
  used_at?: string;
  checkedInAt?: string;
  error?: string;
  idempotent?: boolean;
};

export type DoorScanResultState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'duplicate'
  | 'invalid'
  | 'offline_queued';

export type DoorScanFlowResult = {
  state: DoorScanResultState;
  attendeeName?: string;
  tierName?: string;
  ticketCode?: string;
  checkedInAt?: string;
  message?: string;
};
