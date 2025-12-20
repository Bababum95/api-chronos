import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActivitiesModule } from '@/modules/activities/activities.module';
import { Project, ProjectSchema } from '@/schemas/project.schema';
import { User, UserSchema } from '@/schemas/user.schema';

import { ProjectsController } from './projects.controller';
import { ProjectAggregationService } from './services/project-aggregation.service';
import { ProjectQueryBuilderService } from './services/project-query-builder.service';
import { ProjectsService } from './services/projects.service';

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
