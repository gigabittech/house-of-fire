export { normalizeTicketCode } from './codes';
export {
  getGuestCacheMeta,
  hydrateGuestCacheFromIdb,
  lookupCachedTicket,
  markCachedTicketUsed,
  prefetchGuestCache,
  readGuestCache,
  writeGuestCache,
} from './guestStore';
export {
  drainCheckInQueue,
  enqueueCheckIn,
  generateClientScanId,
  getQueuedCheckIns,
  isCodeQueued,
  postCheckIn,
  wasRecentlyScanned,
  type DrainResult,
} from './queue';
export { processDoorScan } from './scanFlow';
export { startDoorSyncService } from './syncService';
export type {
  CachedGuestTicket,
  DoorScanFlowResult,
  GuestCachePayload,
  QueuedCheckIn,
  ScanApiSuccess,
} from './types';
