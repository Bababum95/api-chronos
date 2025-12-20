import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Heartbeat, HeartbeatSchema } from '@/schemas/heartbeat.schema';
import { HourlyActivity, HourlyActivitySchema } from '@/schemas/hourly-activity.schema';
import { Project, ProjectSchema } from '@/schemas/project.schema';
import { User, UserSchema } from '@/schemas/user.schema';

import { HeartbeatsController } from './heartbeats.controller';
import { HeartbeatsService } from './heartbeats.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Heartbeat.name, schema: HeartbeatSchema },
      { name: HourlyActivity.name, schema: HourlyActivitySchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [HeartbeatsController],
  providers: [HeartbeatsService],
})
export class HeartbeatsModule {}
