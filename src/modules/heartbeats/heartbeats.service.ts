import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Heartbeat, HeartbeatDocument } from '@/schemas/heartbeat.schema';
import { HourlyActivity, HourlyActivityModel } from '@/schemas/hourly-activity.schema';
import { Project, ProjectDocument } from '@/schemas/project.schema';
import { HeartbeatsInput } from '@/common/dto/validation-schemas';

@Injectable()
export class HeartbeatsService {
  constructor(
    @InjectModel(Heartbeat.name) private heartbeatModel: Model<HeartbeatDocument>,
    @InjectModel(HourlyActivity.name) private hourlyActivityModel: HourlyActivityModel,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>
  ) {}

  async saveHeartbeats(userId: string, data: HeartbeatsInput) {
    if (data.heartbeats?.length) {
      const heartbeats = [...data.heartbeats].sort((a, b) => a.time - b.time);

      await this.heartbeatModel.insertMany(
        data.heartbeats.map((heartbeat) => ({
          ...heartbeat,
          user: userId,
        })),
        { ordered: false }
      );

      await this.hourlyActivityModel.updateFromHeartbeats(
        userId as any,
        heartbeats[0].time,
        heartbeats[heartbeats.length - 1].time,
        this.heartbeatModel,
        this.projectModel
      );
    }

    return {
      success: true,
      message: 'Heartbeats saved',
      count: data.heartbeats?.length,
    };
  }
}
