import type { DoorScanResultData } from '@hof/ui';
import { processDoorScan as processScan } from '@hof/door-checkin';

export type DoorScanFlowResult = {
  result: DoorScanResultData;
};

export async function processDoorScan(
  rawCode: string,
  eventId: string | null,
): Promise<DoorScanFlowResult> {
  const result = await processScan(rawCode, { eventId });
  return { result };
}

export { drainCheckInQueue } from '@hof/door-checkin';
