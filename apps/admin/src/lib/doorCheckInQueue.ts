export {
  drainCheckInQueue,
  enqueueCheckIn,
  generateClientScanId,
  getQueuedCheckIns,
  isCodeQueued,
  postCheckIn,
  wasRecentlyScanned,
  type QueuedCheckIn,
  type ScanApiSuccess,
} from '@hof/door-checkin';

export type { DrainResult } from '@hof/door-checkin';
