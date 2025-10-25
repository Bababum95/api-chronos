import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';

@Injectable()
export class ProjectAggregationService {
  /** Builds activity aggregation for total time spent */
  getActivityAggregationStages(): PipelineStage[] {
    return [
      {
        $lookup: {
          from: 'hourlyactivities',
          let: { projectId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$root_project', '$$projectId'] },
                    { $eq: ['$project', '$$projectId'] },
                  ],
                },
              },
            },
            { $group: { _id: null, total_time_spent: { $sum: '$time_spent' } } },
          ],
          as: 'activity_summary',
        },
      },
      {
        $addFields: {
          total_time_spent: { $ifNull: [{ $first: '$activity_summary.total_time_spent' }, 0] },
        },
      },
      { $project: { activity_summary: 0 } },
    ];
  }
}
