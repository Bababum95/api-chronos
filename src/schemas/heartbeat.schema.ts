import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type HeartbeatDocument = HydratedDocument<Heartbeat>;

@Schema({ timestamps: true })
export class Heartbeat extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  time: number;

  @Prop({ required: true })
  entity: string;

  @Prop({ required: true })
  is_write: boolean;

  @Prop({ required: true })
  lineno: number;

  @Prop({ required: true })
  cursorpos: number;

  @Prop({ required: true })
  lines_in_file: number;

  @Prop()
  alternate_project?: string;

  @Prop()
  git_branch?: string;

  @Prop()
  project_folder?: string;

  @Prop()
  project_root_count?: number;

  @Prop()
  language?: string;

  @Prop({ type: String, enum: ['debugging', 'ai coding', 'building', 'code reviewing'] })
  category?: 'debugging' | 'ai coding' | 'building' | 'code reviewing';

  @Prop()
  ai_line_changes?: number;

  @Prop()
  human_line_changes?: number;

  @Prop()
  is_unsaved_entity?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const HeartbeatSchema = SchemaFactory.createForClass(Heartbeat);
