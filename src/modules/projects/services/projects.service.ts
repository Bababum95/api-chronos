import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';

import { Project, ProjectDocument } from '@/schemas/project.schema';
import { createSuccessResponse } from '@/common/types/api-response.type';
import { ActivitiesService } from '@/modules/activities/activities.service';

import { FindAllProjectsQueryDto } from '../dto/find-all-query.dto';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';

import { ProjectAggregationService } from './project-aggregation.service';
import { ProjectQueryBuilderService } from './project-query-builder.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    private readonly aggService: ProjectAggregationService,
    private readonly queryBuilder: ProjectQueryBuilderService,
    private readonly activitiesService: ActivitiesService
  ) {}

  async findAll(userId: string, query: FindAllProjectsQueryDto) {
    const filters = this.queryBuilder.buildFindAllFilters(userId, query);
    const { limit, page } = query;

    const stages: PipelineStage[] = [
      { $match: filters },
      ...this.aggService.getActivityAggregationStages(),
      ...(limit > 0 ? [{ $skip: (page - 1) * limit }, { $limit: limit }] : []),
    ];

    const [items, total] = await Promise.all([
      this.projectModel.aggregate(stages).exec(),
      this.projectModel.countDocuments(filters).exec(),
    ]);

    return createSuccessResponse('Projects fetched successfully', { items, total, page, limit });
  }

  async create(dto: CreateProjectDto, userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const created = await this.projectModel.create({
      ...dto,
      user: userObjectId,
      parent: dto.parent ? new Types.ObjectId(dto.parent) : undefined,
    });

    return created.toObject();
  }

  async getFavorites(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const favorites = await this.projectModel
      .find({ user: userObjectId, is_favorite: true })
      .select('name')
      .lean()
      .exec();
    return createSuccessResponse('Favorites fetched successfully', favorites);
  }

  async findForSelect(userId: string, query: FindAllProjectsQueryDto) {
    const filters = this.queryBuilder.buildFindAllFilters(userId, query);
    const { limit, page } = query;

    const total = await this.projectModel.countDocuments(filters).exec();
    const projects = await this.projectModel
      .find(filters)
      .select('_id name')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    const items = projects.map((p) => ({
      value: p._id.toString(),
      label: p.name,
    }));

    const response = {
      items,
      total,
      page,
      limit,
    };

    return createSuccessResponse('Projects for select fetched successfully', response);
  }

  async findOne(id: string, userId: string) {
    const matchStage: PipelineStage.Match = {
      $match: { _id: new Types.ObjectId(id), user: new Types.ObjectId(userId) },
    };

    const lookupParentStage: PipelineStage.Lookup = {
      $lookup: {
        from: 'projects',
        localField: 'parent',
        foreignField: '_id',
        as: 'parent_data',
        pipeline: [{ $project: { _id: 1, name: 1 } }],
      },
    };

    const addParentObjectStage: PipelineStage.AddFields = {
      $addFields: {
        parent: { $first: '$parent_data' },
      },
    };

    const aggregation: PipelineStage[] = [
      matchStage,
      lookupParentStage,
      addParentObjectStage,
      ...this.aggService.getActivityAggregationStages(),
      { $project: { parent_data: 0 } },
    ];

    const [project] = await this.projectModel.aggregate(aggregation).exec();

    if (!project) {
      const owner = await this.projectModel.exists({ _id: id });
      if (owner) throw new ForbiddenException('You do not have access to this project');
      throw new NotFoundException('Project not found');
    }

    return createSuccessResponse('Project fetched successfully', project);
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const projectObjectId = new Types.ObjectId(id);

    // Never allow changing ownership
    const { parent, ...rest } = dto;

    const update: Partial<Project> = { ...rest };
    if (typeof parent !== 'undefined') {
      const newParent = parent ? new Types.ObjectId(parent) : null;
      update.parent = newParent;

      await this.activitiesService.updateRootProject(projectObjectId, newParent ?? projectObjectId);
    }

    const updated = await this.projectModel
      .findOneAndUpdate({ _id: projectObjectId, user: userObjectId }, update, {
        new: true,
        runValidators: true,
      })
      .lean()
      .exec();

    if (updated) return createSuccessResponse('Project updated successfully', updated);

    const exists = await this.projectModel.findById(id).select('_id user').lean().exec();
    if (exists) {
      throw new ForbiddenException('You do not have access to this project');
    }

    throw new NotFoundException('Project not found');
  }

  async remove(id: string, userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const deleted = await this.projectModel
      .findOneAndDelete({ _id: id, user: userObjectId })
      .lean()
      .exec();

    if (deleted) return { success: true };

    const exists = await this.projectModel.findById(id).select('_id user').lean().exec();
    if (exists) {
      throw new ForbiddenException('You do not have access to this project');
    }

    throw new NotFoundException('Project not found');
  }
}
