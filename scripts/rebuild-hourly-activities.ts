import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import mongoose from 'mongoose';

import { HourlyActivity } from '../src/schemas/hourly-activity.schema';
import { Heartbeat } from '../src/schemas/heartbeat.schema';
import { Project } from '../src/schemas/project.schema';
import { User } from '../src/schemas/user.schema';
import { toHourStart, toHourEnd } from '../src/common/utils/time.utils';
import { AppModule } from '../src/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('RebuildHourlyActivity');

  const userModel = app.get(getModelToken(User.name));
  const hbModel = app.get(getModelToken(Heartbeat.name));
  const projectModel = app.get(getModelToken(Project.name));
  const hourlyModel = app.get(getModelToken(HourlyActivity.name));

  const users = await userModel.find().select('_id email').lean();
  logger.log(`Found ${users.length} users.`);

  for (const user of users) {
    logger.log(`Processing user: ${user.email}`);

    const minTimeDoc = await hbModel.findOne({ user: user._id }).sort({ time: 1 }).lean();
    const maxTimeDoc = await hbModel.findOne({ user: user._id }).sort({ time: -1 }).lean();

    if (!minTimeDoc || !maxTimeDoc) {
      logger.warn(`No heartbeats for user ${user.email}, skipping`);
      continue;
    }

    const start = toHourStart(minTimeDoc.time);
    const end = toHourEnd(maxTimeDoc.time);

    logger.log(
      `User ${user.email}: rebuilding from ${new Date(start * 1000).toISOString()} to ${new Date(end * 1000).toISOString()}`
    );

    try {
      await hourlyModel.updateFromHeartbeats(user._id, start, end, hbModel, projectModel);
      logger.log(`✅ Completed ${user.email}`);
    } catch (err) {
      logger.error(`❌ Failed for ${user.email}:`, err);
    }
  }

  await mongoose.disconnect();
  await app.close();
}

bootstrap();
