import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { parseOrThrow } from '@/common/utils/validation.utils';
import { CreateProjectSchema, UpdateProjectSchema } from '@/common/dto/validation-schemas';

import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(ApiKeyGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() body: any) {
    try {
      const validatedData = parseOrThrow(CreateProjectSchema, body);
      return await this.projectsService.create(validatedData, user._id);
    } catch (error: any) {
      if (error.message === 'ValidationError') {
        throw new HttpException(
          {
            success: false,
            message: 'Validation failed',
            errors: error.details,
          },
          HttpStatus.BAD_REQUEST
        );
      }
      throw error;
    }
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    return await this.projectsService.findAll(user._id, query);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return await this.projectsService.findOne(id, user._id);
  }

  @Put(':id')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    try {
      const validatedData = parseOrThrow(UpdateProjectSchema, body);
      return await this.projectsService.update(id, validatedData, user._id);
    } catch (error: any) {
      if (error.message === 'ValidationError') {
        throw new HttpException(
          {
            success: false,
            message: 'Validation failed',
            errors: error.details,
          },
          HttpStatus.BAD_REQUEST
        );
      }
      throw error;
    }
  }

  @Delete(':id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return await this.projectsService.remove(id, user._id);
  }
}
