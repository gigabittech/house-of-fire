import { lookupCachedTicket, markCachedTicketUsed } from './guestStore';
import {
  drainCheckInQueue,
  enqueueCheckIn,
  generateClientScanId,
  isCodeQueued,
  postCheckIn,
  wasRecentlyScanned,
} from './queue';
import type { DoorScanFlowResult, ScanApiSuccess } from './types';

export type ProcessDoorScanOptions = {
  eventId: string | null;
  scanApiPath?: string;
};

function successResult(data: ScanApiSuccess): DoorScanFlowResult {
  const name = data.holder?.display_name ?? 'Guest';
  const tier = data.tier?.display_name ?? data.tier?.name ?? 'GA';
  return {
    state: 'success',
    attendeeName: name,
    tierName: tier,
    ticketCode: data.code ?? '',
    checkedInAt: data.used_at ?? data.checkedInAt,
    message: data.idempotent ? 'Already synced' : undefined,
  };
}

function duplicateResult(
  data: ScanApiSuccess,
  cached?: { holder_name: string; tier_name: string; code: string; checked_in_at: string | null },
): DoorScanFlowResult {
  return {
    state: 'duplicate',
    attendeeName: data.holder?.display_name ?? cached?.holder_name,
    tierName: data.tier?.display_name ?? data.tier?.name ?? cached?.tier_name,
    ticketCode: data.code ?? cached?.code,
    checkedInAt: data.checkedInAt ?? data.used_at ?? cached?.checked_in_at ?? undefined,
    message: data.error,
  };
}

function offlineQueuedResult(cached: {
  holder_name: string;
  tier_name: string;
  code: string;
}): DoorScanFlowResult {
  return {
    state: 'offline_queued',
    attendeeName: cached.holder_name,
    tierName: cached.tier_name,
    ticketCode: cached.code,
    message: 'Saved locally — will sync when back online.',
  };
}

export async function processDoorScan(
  rawCode: string,
  options: ProcessDoorScanOptions,
): Promise<DoorScanFlowResult> {
  const { eventId, scanApiPath = '/api/admin/door/scan' } = options;
  const cached = eventId ? lookupCachedTicket(eventId, rawCode) : null;

  if (wasRecentlyScanned(rawCode) || isCodeQueued(rawCode)) {
    if (cached?.status === 'used') {
      return duplicateResult({}, cached);
    }
    return {
      state: 'duplicate',
      message: 'Scan already processing — wait a moment.',
      ticketCode: cached?.code,
      attendeeName: cached?.holder_name,
      tierName: cached?.tier_name,
    };
  }

  if (!navigator.onLine) {
    if (!cached) {
      return {
        state: 'invalid',
        message: "Can't verify offline — download the guest list while online first.",
      };
    }
    if (cached.status === 'used') {
      return duplicateResult({}, cached);
    }
    const now = new Date().toISOString();
    const clientScanId = generateClientScanId();
    const queued = enqueueCheckIn({
      client_scan_id: clientScanId,
      code: rawCode,
      scanned_at: now,
      event_id: eventId ?? undefined,
    });
    if (!queued) {
      return { state: 'duplicate', message: 'Already queued for sync.' };
    }
    if (eventId) markCachedTicketUsed(eventId, rawCode, now);
    return offlineQueuedResult(cached);
  }

  const clientScanId = generateClientScanId();
  const apiResult = await postCheckIn(
    {
      client_scan_id: clientScanId,
      code: rawCode,
      scanned_at: new Date().toISOString(),
      event_id: eventId ?? undefined,
    },
    scanApiPath,
  );

  if (apiResult.ok) {
    if (eventId) {
      markCachedTicketUsed(
        eventId,
        rawCode,
        apiResult.data.used_at ?? apiResult.data.checkedInAt ?? new Date().toISOString(),
      );
    }
    return successResult(apiResult.data);
  }

  if (apiResult.status === 409) {
    return duplicateResult(apiResult.data ?? {}, cached ?? undefined);
  }

  if (apiResult.retryable && cached?.status === 'valid' && eventId) {
    const now = new Date().toISOString();
    const queued = enqueueCheckIn({
      client_scan_id: clientScanId,
      code: rawCode,
      scanned_at: now,
      event_id: eventId,
    });
    if (queued) {
      markCachedTicketUsed(eventId, rawCode, now);
      return offlineQueuedResult(cached);
    }
  }

  return {
    state: 'invalid',
    message: apiResult.error,
  };
}

export { drainCheckInQueue };
