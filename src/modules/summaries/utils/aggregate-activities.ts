import { Activity } from '../types/activity.type';

export function aggregateActivities(activities: Activity[][]): Activity[][] {
  return activities.map((group) => {
    const map = new Map<string, Activity>();

    for (const act of group) {
      const key = JSON.stringify({
        timestamp: act.timestamp,
        root_project: act.root_project ?? null,
      });

      if (!map.has(key)) {
        map.set(key, { ...act });
      } else {
        const existing = map.get(key)!;
        existing.time_spent += act.time_spent;
      }
    }

    return Array.from(map.values());
  });
}
