import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { HourlyActivity, HourlyActivityDocument } from '../../schemas/hourly-activity.schema';
import { SummariesQuery } from '../../common/dto/validation-schemas';
import { createSuccessResponse } from '../../common/types/api-response.type';
import { formatDuration } from '../../common/utils/time.utils';
import { HOUR, DAY } from '../../config/constants';

type Activity = {
  timestamp: number;
  time_spent: number;
  alternate_project?: string;
  git_branch?: string;
  project_folder?: string;
};

function aggregateActivities(activities: Activity[][]): Activity[][] {
  return activities.map((group) => {
    const map = new Map<string, Activity>();

    for (const act of group) {
      const key = JSON.stringify({
        timestamp: act.timestamp,
        alternate_project: act.alternate_project ?? null,
        git_branch: act.git_branch ?? null,
        project_folder: act.project_folder ?? null,
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

@Injectable()
export class SummariesService {
  constructor(
    @InjectModel(HourlyActivity.name) private hourlyActivityModel: Model<HourlyActivityDocument>
  ) {}

  async getTotalSummaries(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const data = await this.hourlyActivityModel.find({ user: userObjectId });
    const totalTime = data.reduce((acc, curr) => acc + curr.time_spent, 0);

    return createSuccessResponse('Summaries fetched successfully', { totalTime });
  }

  async getSummariesRange(userId: string, query: SummariesQuery, intervalParam?: string) {
    const startSec = Number(query.start);
    const endSec = Number(query.end);
    const range = endSec - startSec;
    const interval = Number(intervalParam ?? (range < DAY ? HOUR : DAY));
    const userObjectId = new Types.ObjectId(userId);

    const data = await this.hourlyActivityModel
      .find({
        user: userObjectId,
        timestamp: { $gte: startSec, $lte: endSec },
      })
      .select('alternate_project git_branch project_folder time_spent timestamp')
      .lean();

    const totalTime = data.reduce((acc, curr) => acc + curr.time_spent, 0);

    const response: any = {
      totalTime,
      totalTimeStr: formatDuration(totalTime),
      start: query.start,
      end: query.end,
    };

    if (query.full) {
      const grouped = new Map<number, Activity[]>();

      for (const activity of data) {
        const offset = activity.timestamp - startSec;
        const bucket = startSec + Math.floor(offset / interval) * interval;

        if (!grouped.has(bucket)) {
          grouped.set(bucket, []);
        }
        grouped.get(bucket)!.push({ ...activity, timestamp: bucket } as Activity);
      }

      const activities: Activity[][] = [];

      for (let ts = startSec; ts <= endSec; ts += interval) {
        if (grouped.has(ts)) {
          activities.push(grouped.get(ts)!);
        } else {
          activities.push([{ time_spent: 0, timestamp: ts }]);
        }
      }

      response.activities = aggregateActivities(activities);
    }

    return createSuccessResponse('Summaries fetched successfully', response);
  }
}
