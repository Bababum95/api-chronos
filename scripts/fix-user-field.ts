import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import mongoose, { Types, Model, Document } from 'mongoose';

import { Heartbeat } from '../src/schemas/heartbeat.schema';
import { HourlyActivity } from '../src/schemas/hourly-activity.schema';
import { AppModule } from '../src/app.module';

interface DocumentWithUser extends Document {
  user?: string | Types.ObjectId;
}

async function fixUserField<T extends DocumentWithUser>(model: Model<T>) {
  const logger = new Logger('FixUserField');

  const records = await model.find({ user: { $exists: true, $type: 'string' } }).lean();

  logger.log(`Found ${records.length} records with user as string`);

  if (records.length === 0) return;

  const operations = records.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: { user: new Types.ObjectId(doc.user) } },
    },
  }));

  const result = await model.bulkWrite(operations);
  logger.log(`Fixed ${result.modifiedCount || 0} records`);
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const hbModel = app.get(getModelToken(Heartbeat.name));
    await fixUserField(hbModel);

    const hourlyModel = app.get(getModelToken(HourlyActivity.name));
    await fixUserField(hourlyModel);
  } catch (err) {
    console.error('Error fixing user fields:', err);
  } finally {
    await mongoose.disconnect();
    await app.close();
  }
}

bootstrap();
