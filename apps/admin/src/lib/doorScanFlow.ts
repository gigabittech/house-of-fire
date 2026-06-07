import type { DoorScanResultData } from '@hof/ui';
import {
  drainCheckInQueue,
  enqueueCheckIn,
  generateClientScanId,
  postCheckIn,
  type ScanApiSuccess,
} from './doorCheckInQueue';
import { lookupCachedTicket, markCachedTicketUsed } from './doorGuestCache';

export type DoorScanFlowResult = {
  result: DoorScanResultData;
};

function successResult(data: ScanApiSuccess): DoorScanFlowResult {
  const name = data.holder?.display_name ?? 'Guest';
  const tier = data.tier?.display_name ?? data.tier?.name ?? 'GA';
  const code = data.code ?? '';
  return {
    result: {
      state: 'success',
      attendeeName: name,
      tierName: tier,
      ticketCode: code,
      checkedInAt: data.used_at ?? data.checkedInAt,
    },
  };
}

function duplicateResult(
  data: ScanApiSuccess,
  cached?: { holder_name: string; tier_name: string; code: string; checked_in_at: string | null },
): DoorScanFlowResult {
  return {
    result: {
      state: 'duplicate',
      attendeeName: data.holder?.display_name ?? cached?.holder_name,
      tierName: data.tier?.display_name ?? data.tier?.name ?? cached?.tier_name,
      ticketCode: data.code ?? cached?.code,
      checkedInAt: data.checkedInAt ?? data.used_at ?? cached?.checked_in_at ?? undefined,
      message: data.error,
    },
  };
}

function offlineQueuedResult(cached: {
  holder_name: string;
  tier_name: string;
  code: string;
}): DoorScanFlowResult {
  return {
    result: {
      state: 'offline_queued',
      attendeeName: cached.holder_name,
      tierName: cached.tier_name,
      ticketCode: cached.code,
      message: 'Saved locally — will sync when back online.',
    },
  };
}

export async function processDoorScan(
  rawCode: string,
  eventId: string | null,
): Promise<DoorScanFlowResult> {
  const cached = eventId ? lookupCachedTicket(eventId, rawCode) : null;

  if (!navigator.onLine) {
    if (!cached) {
      return {
        result: {
          state: 'invalid',
          message: "Can't verify offline — connect to check unknown tickets.",
        },
      };
    }
    if (cached.status === 'used') {
      return duplicateResult({}, cached);
    }
    const now = new Date().toISOString();
    enqueueCheckIn({ client_scan_id: generateClientScanId(), code: rawCode, scanned_at: now });
    if (eventId) markCachedTicketUsed(eventId, rawCode, now);
    return offlineQueuedResult(cached);
  }

  const apiResult = await postCheckIn({
    client_scan_id: generateClientScanId(),
    code: rawCode,
    scanned_at: new Date().toISOString(),
  });

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
    enqueueCheckIn({ client_scan_id: generateClientScanId(), code: rawCode, scanned_at: now });
    markCachedTicketUsed(eventId, rawCode, now);
    return offlineQueuedResult(cached);
  }

  return {
    result: {
      state: 'invalid',
      message: apiResult.error,
    },
  };
}

export { drainCheckInQueue };
