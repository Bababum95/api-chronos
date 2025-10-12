import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Model, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;
export type ProjectModel = Model<ProjectDocument>;

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  project_folder: string;

  @Prop({ type: [String], default: [] })
  git_branches: string[];

  @Prop()
  alternate_project?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  parent?: Types.ObjectId;

  @Prop()
  description?: string;

  @Prop({ required: true })
  name: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ user: 1 });
ProjectSchema.index({ parent: 1 });
ProjectSchema.index({ name: 1 });
ProjectSchema.index({ user: 1, project_folder: 1 }, { unique: true });
