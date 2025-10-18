import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { HourlyActivity, HourlyActivityDocument } from '@/schemas/hourly-activity.schema';
import { createSuccessResponse } from '@/common/types/api-response.type';
import { formatDuration } from '@/common/utils/time.utils';
import { bucketActivities } from '@/common/utils/bucket-activities.utils';

import type { ActivitiesQueryDto } from './dto/activities-query.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(HourlyActivity.name)
    private hourlyActivityModel: Model<HourlyActivityDocument>
  ) {}

  async findByProject(
    projectId: string,
    userId: string,
    { start, end, interval }: ActivitiesQueryDto
  ) {
    const userObjectId = new Types.ObjectId(userId);
    const projectObjectId = new Types.ObjectId(projectId);

    const data = await this.hourlyActivityModel
      .find({
        user: userObjectId,
        timestamp: { $gte: start, $lte: end },
        $or: [{ project: projectObjectId }, { root_project: projectObjectId }],
      })
      .lean();

    const totalTime = data.reduce((acc, curr) => acc + curr.time_spent, 0);

    return createSuccessResponse('Activities fetched successfully', {
      totalTime,
      totalTimeStr: formatDuration(totalTime),
      start,
      end,
      activities: bucketActivities(data, start, end, interval),
    });
  }
}
