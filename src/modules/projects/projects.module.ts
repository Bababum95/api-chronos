import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Project, ProjectSchema } from '@/schemas/project.schema';
import { User, UserSchema } from '@/schemas/user.schema';
import { ActivitiesModule } from '@/modules/activities/activities.module';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './services/projects.service';
import { ProjectQueryBuilderService } from './services/project-query-builder.service';
import { ProjectAggregationService } from './services/project-aggregation.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ActivitiesModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectAggregationService, ProjectQueryBuilderService],
})
export class ProjectsModule {}
