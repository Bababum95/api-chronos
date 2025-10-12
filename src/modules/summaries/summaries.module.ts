import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '@/schemas/user.schema';
import { HourlyActivity, HourlyActivitySchema } from '@/schemas/hourly-activity.schema';

import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: HourlyActivity.name, schema: HourlyActivitySchema },
    ]),
  ],
  controllers: [SummariesController],
  providers: [SummariesService],
})
export class SummariesModule {}
