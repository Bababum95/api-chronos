import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { HourlyActivity, HourlyActivityDocument } from '@/schemas/hourly-activity.schema';
import { createSuccessResponse } from '@/common/types/api-response.type';
import { formatDuration } from '@/common/utils/time.utils';
import { bucketActivities } from '@/common/utils/bucket-activities.utils';

import { aggregateActivities } from './utils/aggregate-activities';
import type { SummariesRangeResponse } from './types/summary-response.type';
import type { Activity } from './types/activity.type';
import type { GetSummariesRangeDto } from './dto/get-summaries-range.dto';

@Injectable()
export class SummariesService {
  constructor(
    @InjectModel(HourlyActivity.name)
    private hourlyActivityModel: Model<HourlyActivityDocument>
  ) {}

  async getTotalSummaries(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const result = await this.hourlyActivityModel.aggregate([
      { $match: { user: userObjectId } },
      { $group: { _id: null, totalTime: { $sum: '$time_spent' } } },
    ]);

    const totalTime = result[0]?.totalTime ?? 0;

    return createSuccessResponse('Summaries fetched successfully', { totalTime });
  }

  async getSummariesRange(userId: string, { start, end, full, interval }: GetSummariesRangeDto) {
    const userObjectId = new Types.ObjectId(userId);

    const data = await this.hourlyActivityModel
      .find({ user: userObjectId, timestamp: { $gte: start, $lte: end } })
      .select('root_project time_spent timestamp')
      .populate('root_project', 'name')
      .lean<Activity[]>();

    const totalTime = data.reduce((acc, curr) => acc + curr.time_spent, 0);

    const response: SummariesRangeResponse = {
      totalTime,
      end,
      start,
      totalTimeStr: formatDuration(totalTime),
    };

    if (full) {
      const activitiesBuckets = bucketActivities(data, start, end, interval);
      response.activities = aggregateActivities(activitiesBuckets);
    }

    return createSuccessResponse('Summaries fetched successfully', response);
  }
}
