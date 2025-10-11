import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { HEARTBEAT_INTERVAL_SEC, HOUR } from '../config/constants';
import { calculateActiveTime } from '../common/utils/heartbeat.utils';
import { toHourEnd, toHourStart } from '../common/utils/time.utils';

export type HourlyActivityDocument = HydratedDocument<HourlyActivity>;

@Schema({ timestamps: true })
export class HourlyActivity extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  timestamp: number;

  @Prop({ type: String, index: true, unique: true })
  composite_key: string;

  @Prop()
  alternate_project?: string;

  @Prop()
  project_folder?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  project?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  root_project?: Types.ObjectId;

  @Prop()
  git_branch?: string;

  @Prop()
  language?: string;

  @Prop({ type: String, enum: ['debugging', 'ai coding', 'building', 'code reviewing'] })
  category?: 'debugging' | 'ai coding' | 'building' | 'code reviewing';

  @Prop({
    required: true,
    min: 0,
  })
  time_spent: number;

  createdAt: Date;
  updatedAt: Date;
}

export const HourlyActivitySchema = SchemaFactory.createForClass(HourlyActivity);

HourlyActivitySchema.index({ user: 1, timestamp: 1 });
HourlyActivitySchema.index({ user: 1, composite_key: 1 });

// Static method for updating from heartbeats
export interface HourlyActivityModel extends Model<HourlyActivityDocument> {
  updateFromHeartbeats: (
    userId: Types.ObjectId,
    start: number,
    end: number,
    heartbeatModel: Model<any>,
    projectModel: Model<any>
  ) => Promise<void>;
}

HourlyActivitySchema.statics.updateFromHeartbeats = async function (
  userId: Types.ObjectId,
  start: number,
  end: number,
  heartbeatModel: Model<any>,
  projectModel: Model<any>
) {
  const startTimestamp = toHourStart(start);
  const endTimestamp = toHourEnd(end);
  const projectCache = new Map<
    string,
    { _id: Types.ObjectId; parent?: Types.ObjectId; git_branches?: string[] }
  >();

  const heartbeats = await heartbeatModel
    .find({
      user: userId,
      time: { $gte: startTimestamp, $lte: endTimestamp },
    })
    .sort({ time: 1 });

  const groups = new Map();
  for (const hb of heartbeats) {
    if (!projectCache.has(hb.project_folder)) {
      let project: any = await projectModel
        .findOne({ user: userId, project_folder: hb.project_folder })
        .select('_id parent git_branches')
        .lean();

      if (!project) {
        const newProject = await projectModel.create({
          name: hb.alternate_project || hb.project_folder || 'unknown',
          user: userId,
          project_folder: hb.project_folder,
          alternate_project: hb.alternate_project,
          git_branches: hb.git_branch ? [hb.git_branch] : [],
        });

        project = {
          _id: newProject._id,
          parent: newProject.parent,
          git_branches: newProject.git_branches,
        };
      }

      projectCache.set(hb.project_folder, project);
    }

    const project = projectCache.get(hb.project_folder);
    if (!project) continue;

    if (hb.git_branch) {
      project.git_branches = Array.from(new Set([...(project.git_branches || []), hb.git_branch]));
    }

    const key = JSON.stringify({
      category: hb.category || null,
      language: hb.language || null,
      project_folder: hb.project_folder || null,
      alternate_project: hb.alternate_project || null,
      git_branch: hb.git_branch || null,
      project: project?._id || null,
      timestamp: toHourStart(hb.time),
    });

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(hb);
  }

  for (const [key, hb] of groups.entries()) {
    const first = hb[0];
    if (!first) continue;

    let activeTime = calculateActiveTime(hb, startTimestamp, endTimestamp);
    const project = projectCache.get(first.project_folder);

    if (activeTime >= HOUR - HEARTBEAT_INTERVAL_SEC) activeTime = HOUR;

    await this.findOneAndUpdate(
      { composite_key: key },
      {
        $set: { time_spent: activeTime },
        $setOnInsert: {
          user: userId,
          category: first.category,
          language: first.language,
          project_folder: first.project_folder,
          alternate_project: first.alternate_project,
          git_branch: first.git_branch,
          project: project?._id,
          root_project: project?.parent ?? project?._id,
          timestamp: toHourStart(first.time),
        },
      },
      { upsert: true, new: true }
    );
  }

  const bulkOps: any[] = [];

  for (const [_path, project] of projectCache.entries()) {
    if (!project?._id || !project.git_branches?.length) continue;

    bulkOps.push({
      updateOne: {
        filter: { _id: project._id },
        update: { $set: { git_branches: project.git_branches } },
      },
    });
  }

  if (bulkOps.length > 0) {
    await projectModel.bulkWrite(bulkOps);
  }
};
