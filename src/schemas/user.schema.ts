import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
  })
  email: string;

  @Prop({
    required: false,
    minlength: 6,
    select: false,
  })
  password?: string;

  @Prop({
    required: true,
    unique: true,
    default: () => `chronos_${uuidv4()}`,
  })
  apiKey: string;

  @Prop({
    default: false,
  })
  isEmailVerified: boolean;

  @Prop({
    default: null,
  })
  avatarUrl?: string;

  @Prop({
    type: [String],
    default: [],
  })
  gallery: string[];

  createdAt: Date;
  updatedAt: Date;

  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user by API key
UserSchema.statics.findByApiKey = async function (apiKey: string) {
  const user = await this.findOne({ apiKey }).lean().exec();
  if (!user) return null;
  return { ...user, _id: user._id.toString() };
};
