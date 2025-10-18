import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { AuthenticatedUser } from '@/common/types/authenticated-user';
import { ActivitiesService } from '@/modules/activities/activities.service';
import { ActivitiesQueryDto } from '@/modules/activities/dto/activities-query.dto';

import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FindAllProjectsQueryDto } from './dto/find-all-query.dto';

@ApiTags('projects')
@ApiBearerAuth('bearer')
@Controller('projects')
@UseGuards(ApiKeyGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly activitiesService: ActivitiesService
  ) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto, user._id);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: FindAllProjectsQueryDto) {
    return this.projectsService.findAll(user._id, query);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projectsService.findOne(id, user._id);
  }

  @Get(':id/activities')
  async getActivities(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: ActivitiesQueryDto
  ) {
    return this.activitiesService.findByProject(id, user._id, query);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto
  ) {
    return this.projectsService.update(id, dto, user._id);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projectsService.remove(id, user._id);
  }
}
