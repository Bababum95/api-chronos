import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types, PipelineStage } from 'mongoose';

import { Project, ProjectDocument } from '@/schemas/project.schema';
import { createSuccessResponse } from '@/common/types/api-response.type';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FindAllProjectsQueryDto } from './dto/find-all-query.dto';
import { FindProjectsForSelectQueryDto } from './dto/find-projects-for-select-query.dto';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>) {}

  async create(dto: CreateProjectDto, userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const created = await this.projectModel.create({
      ...dto,
      user: userObjectId,
      parent: dto.parent ? new Types.ObjectId(dto.parent) : undefined,
    });

    return created.toObject();
  }

  private getActivityAggregationStages(): PipelineStage[] {
    return [
      {
        $lookup: {
          from: 'hourlyactivities',
          let: { projectId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$root_project', '$$projectId'] },
                    { $eq: ['$project', '$$projectId'] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                total_time_spent: { $sum: '$time_spent' },
              },
            },
          ],
          as: 'activity_summary',
        },
      },
      {
        $addFields: {
          total_time_spent: { $ifNull: [{ $first: '$activity_summary.total_time_spent' }, 0] },
        },
      },
      { $project: { activity_summary: 0 } },
    ];
  }

  async findAll(userId: string, query: FindAllProjectsQueryDto) {
    const userObjectId = new Types.ObjectId(userId);
    const { limit, page, root, includeArchived, parent } = query;

    const filters: FilterQuery<ProjectDocument> = { user: userObjectId };
    if (root === true) filters.parent = { $exists: false };
    if (parent) filters.parent = new Types.ObjectId(parent);
    if (includeArchived !== true) filters.is_archived = { $ne: true };

    const baseStages: PipelineStage[] = [
      { $match: filters },
      ...this.getActivityAggregationStages(),
    ];

    if (limit > 0) {
      baseStages.push({ $skip: (page - 1) * limit });
      baseStages.push({ $limit: limit });
    }

    const [items, total] = await Promise.all([
      this.projectModel.aggregate(baseStages).exec(),
      this.projectModel.countDocuments(filters).exec(),
    ]);

    const response = { items, total, page: limit > 0 ? page : 1, limit };
    return createSuccessResponse('Projects fetched successfully', response);
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
      ...this.getActivityAggregationStages(),
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

  async findForSelect(userId: string, query: FindProjectsForSelectQueryDto) {
    const userObjectId = new Types.ObjectId(userId);
    const { page, limit, root, archived } = query;

    // Build filter conditions
    const filters: FilterQuery<ProjectDocument> = { user: userObjectId };

    // If root = true, add condition for projects without parent or with parent = null
    if (root === true) {
      filters.$or = [{ parent: { $exists: false } }, { parent: null }];
    }

    // If archived = false, exclude archived projects
    if (archived === false) {
      filters.is_archived = { $ne: true };
    }

    // Get total count for pagination
    const total = await this.projectModel.countDocuments(filters).exec();

    // Apply pagination and get projects
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

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    // Never allow changing ownership
    const { parent, ...rest } = dto;

    const update: Partial<Project> = { ...rest };
    if (typeof parent !== 'undefined') {
      update.parent = parent ? new Types.ObjectId(parent) : null;
    }

    const updated = await this.projectModel
      .findOneAndUpdate({ _id: id, user: userObjectId }, update, { new: true, runValidators: true })
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
