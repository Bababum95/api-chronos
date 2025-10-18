import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HourlyActivity, HourlyActivitySchema } from '@/schemas/hourly-activity.schema';

import { ActivitiesService } from './activities.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HourlyActivity.name, schema: HourlyActivitySchema }]),
  ],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
