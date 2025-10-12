import { Activity } from '../types/activity.type';

export function bucketActivities(
  activities: Activity[],
  start: number,
  end: number,
  interval: number
): Activity[][] {
  const grouped = new Map<number, Activity[]>();

  for (const activity of activities) {
    const offset = activity.timestamp - start;
    const bucket = start + Math.floor(offset / interval) * interval;

    if (!grouped.has(bucket)) grouped.set(bucket, []);
    grouped.get(bucket)!.push({ ...activity, timestamp: bucket });
  }

  const result: Activity[][] = [];
  for (let ts = start; ts <= end; ts += interval) {
    if (grouped.has(ts)) {
      result.push(grouped.get(ts)!);
    } else {
      result.push([{ time_spent: 0, timestamp: ts }]);
    }
  }

  return result;
}
