import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type FileDocument = HydratedDocument<File>;

@Schema({ timestamps: true })
export class File extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId;

  @Prop({
    required: true,
  })
  originalName: string;

  @Prop({
    required: true,
  })
  mimeType: string;

  @Prop({
    required: true,
    min: 0,
  })
  size: number;

  @Prop({
    required: true,
    type: Buffer,
  })
  data: Buffer;

  @Prop({
    type: String,
    enum: ['avatar'],
    default: 'avatar',
    required: true,
  })
  purpose: 'avatar';

  createdAt: Date;
  updatedAt: Date;
}

export const FileSchema = SchemaFactory.createForClass(File);

// Indexes for better query performance
FileSchema.index({ user: 1 });
FileSchema.index({ createdAt: -1 });
