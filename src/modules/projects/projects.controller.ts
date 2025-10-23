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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { AuthenticatedUser } from '@/common/types/authenticated-user';
import { ActivitiesService } from '@/modules/activities/activities.service';
import { ActivitiesQueryDto } from '@/modules/activities/dto/activities-query.dto';

import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FindAllProjectsQueryDto } from './dto/find-all-query.dto';
import { FindProjectsForSelectQueryDto } from './dto/find-projects-for-select-query.dto';

@ApiTags('projects')
@ApiBearerAuth('bearer')
@Controller('projects')
@UseGuards(ApiKeyGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly activitiesService: ActivitiesService
  ) {}

  @ApiOperation({ summary: 'Create new project' })
  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto, user._id);
  }

  @ApiOperation({ summary: 'Get all projects for user' })
  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: FindAllProjectsQueryDto) {
    return this.projectsService.findAll(user._id, query);
  }

  @Get('select')
  @ApiOperation({ summary: 'Get simplified project list for select' })
  async findForSelect(@CurrentUser() user: AuthenticatedUser, @Query() query: FindProjectsForSelectQueryDto) {
    return this.projectsService.findForSelect(user._id, query);
  }

  @ApiOperation({ summary: 'Get favorite projects for user' })
  @Get('favorites')
  async getFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.getFavorites(user._id);
  }

  @ApiOperation({ summary: 'Get project by ID' })
  @Get(':id')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projectsService.findOne(id, user._id);
  }

  @ApiOperation({ summary: 'Get activities for a project' })
  @Get(':id/activities')
  async getActivities(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: ActivitiesQueryDto
  ) {
    return this.activitiesService.findByProject(id, user._id, query);
  }

  @ApiOperation({ summary: 'Update project by ID' })
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto
  ) {
    return this.projectsService.update(id, dto, user._id);
  }

  @ApiOperation({ summary: 'Mark project as favorite' })
  @Patch('add-to-favorite/:id')
  async addToFavorite(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projectsService.update(id, { is_favorite: true }, user._id);
  }

  @ApiOperation({ summary: 'Unmark project as favorite' })
  @Patch('remove-from-favorite/:id')
  async removeFromFavorite(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projectsService.update(id, { is_favorite: false }, user._id);
  }

  @ApiOperation({ summary: 'Archive project' })
  @Patch('add-to-archive/:id')
  async addToArchive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projectsService.update(id, { is_archived: true }, user._id);
  }

  @ApiOperation({ summary: 'Unarchive project' })
  @Patch('remove-from-archive/:id')
  async removeFromArchive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projectsService.update(id, { is_archived: false }, user._id);
  }

  @ApiOperation({ summary: 'Delete project by ID' })
  @Delete(':id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projectsService.remove(id, user._id);
  }
}
