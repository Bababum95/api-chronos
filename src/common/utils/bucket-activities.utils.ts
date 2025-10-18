import { HOUR, DAY } from '@/config/constants';

type BaseActivity = {
  timestamp: number;
  time_spent: number;
};

export const bucketActivities = <T extends BaseActivity>(
  activities: T[],
  start: number,
  end: number,
  interval?: number
): T[][] => {
  const effectiveInterval = interval ?? (end - start < DAY ? HOUR : DAY);
  const grouped = new Map<number, T[]>();

  for (const activity of activities) {
    const offset = activity.timestamp - start;
    const bucket = start + Math.floor(offset / effectiveInterval) * effectiveInterval;

    if (!grouped.has(bucket)) grouped.set(bucket, []);
    grouped.get(bucket)!.push({ ...activity, timestamp: bucket });
  }

  const result: T[][] = [];
  for (let ts = start; ts <= end; ts += effectiveInterval) {
    if (grouped.has(ts)) {
      result.push(grouped.get(ts)!);
    } else {
      result.push([{ time_spent: 0, timestamp: ts } as T]);
    }
  }

  return result;
};
