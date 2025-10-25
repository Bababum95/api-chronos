import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';

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

  /**
   * Updates all activities for a given project by setting their root_project value.
   * Works in batches to handle large datasets efficiently.
   */
  async updateRootProject(projectId: Types.ObjectId, rootProjectId: Types.ObjectId): Promise<void> {
    const BATCH_SIZE = 1000;
    let lastId: Types.ObjectId | null = null;
    let updatedCount = 0;

    while (true) {
      const query: FilterQuery<HourlyActivityDocument> = { project: projectId };
      if (lastId) query._id = { $gt: lastId };

      const batch = await this.hourlyActivityModel
        .find(query)
        .sort({ _id: 1 })
        .limit(BATCH_SIZE)
        .select('_id')
        .lean<{ _id: Types.ObjectId }[]>();

      if (batch.length === 0) break;

      const ids = batch.map((doc) => doc._id);

      await this.hourlyActivityModel.updateMany(
        { _id: { $in: ids } },
        { $set: { root_project: rootProjectId } }
      );

      updatedCount += ids.length;
      lastId = batch[batch.length - 1]._id;

      console.info(`[updateRootProject] Updated ${updatedCount} activities so far...`);
    }

    console.info(`[updateRootProject] Completed. Total updated: ${updatedCount}`);
  }
}
