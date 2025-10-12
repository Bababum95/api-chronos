import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { HourlyActivity, HourlyActivityDocument } from '@/schemas/hourly-activity.schema';
import { SummariesQuery } from '@/common/dto/validation-schemas';
import { createSuccessResponse } from '@/common/types/api-response.type';
import { formatDuration } from '@/common/utils/time.utils';
import { HOUR, DAY } from '@/config/constants';

import { bucketActivities } from './utils/bucket-activities';
import { aggregateActivities } from './utils/aggregate-activities';
import type { SummariesRangeResponse } from './types/summary-response.type';
import { Activity } from './types/activity.type';

@Injectable()
export class SummariesService {
  constructor(
    @InjectModel(HourlyActivity.name)
    private hourlyActivityModel: Model<HourlyActivityDocument>
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
      .find({ user: userObjectId, timestamp: { $gte: startSec, $lte: endSec } })
      .select('root_project time_spent timestamp')
      .populate('root_project', 'name')
      .lean<Activity[]>();

    const totalTime = data.reduce((acc, curr) => acc + curr.time_spent, 0);

    const response: SummariesRangeResponse = {
      totalTime,
      totalTimeStr: formatDuration(totalTime),
      start: startSec,
      end: endSec,
    };

    if (query.full) {
      const activitiesBuckets = bucketActivities(data, startSec, endSec, interval);
      response.activities = aggregateActivities(activitiesBuckets);
    }

    return createSuccessResponse('Summaries fetched successfully', response);
  }
}
