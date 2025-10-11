import { HEARTBEAT_INTERVAL_SEC } from '../../config/constants';
import { HeartbeatDocument } from '../../schemas/heartbeat.schema';

/**
 * Calculate active time in seconds based on heartbeats within a time range.
 * Uses interval-based calculation to determine active periods.
 */
export const calculateActiveTime = (
  heartbeats: HeartbeatDocument[],
  start: number,
  end: number
) => {
  const intervalSec = HEARTBEAT_INTERVAL_SEC;
  const totalIntervals = Math.ceil((end - start) / intervalSec);

  const activeIntervalSet = new Set<number>();
  for (const hb of heartbeats) {
    const hbTs = Math.floor(hb.time);
    const intervalIdx = Math.floor((hbTs - start) / intervalSec);
    if (intervalIdx >= 0 && intervalIdx < totalIntervals) {
      activeIntervalSet.add(intervalIdx);
    }
  }
  const activeIntervals = activeIntervalSet.size;

  // Adjust activeTimeSec based on last heartbeat elapsed time
  let activeTimeSec = activeIntervals * intervalSec;
  const lastHb = heartbeats[heartbeats.length - 1];
  if (lastHb) {
    const elapsedSec = Math.floor(Date.now() / 1000) - Math.floor(lastHb.time);
    if (elapsedSec < intervalSec) {
      activeTimeSec = (activeIntervals - 1) * intervalSec + Math.floor(elapsedSec / 60) * 60;
    }
  }

  return activeTimeSec;
};
