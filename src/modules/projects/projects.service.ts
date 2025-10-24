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

  async findAll(userId: string, query: FindAllProjectsQueryDto) {
    const userObjectId = new Types.ObjectId(userId);
    const { limit, page, root, includeArchived } = query;

    const filters: FilterQuery<ProjectDocument> = { user: userObjectId };
    if (root === true) filters.parent = { $exists: false };
    // Only include non-archived projects unless includeArchived is true
    if (includeArchived !== true) filters.is_archived = { $ne: true };

    const aggregation: PipelineStage[] = [
      { $match: filters },
      {
        $lookup: {
          from: 'hourlyactivities',
          localField: '_id',
          foreignField: 'root_project',
          as: 'activity',
        },
      },
      {
        $addFields: {
          total_time_spent: { $sum: '$activity.time_spent' },
        },
      },
      { $project: { activity: 0 } },
    ];

    if (limit > 0) {
      aggregation.push({ $skip: (page - 1) * limit });
      aggregation.push({ $limit: limit });
    }

    const [items, total] = await Promise.all([
      this.projectModel.aggregate(aggregation).exec(),
      this.projectModel.countDocuments(filters).exec(),
    ]);

    const response = {
      items,
      total,
      page: limit > 0 ? page : 1,
      limit,
    };

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
    const [project] = await this.projectModel
      .aggregate([
        {
          $match: {
            _id: new Types.ObjectId(id),
            user: new Types.ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: 'parent',
            as: 'children',
          },
        },
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
            ],
            as: 'activities',
          },
        },
        {
          $addFields: {
            total_time_spent: { $sum: '$activities.time_spent' },
          },
        },
        { $project: { activities: 0 } },
      ])
      .exec();

    if (!project) {
      const exists = await this.projectModel.findById(id).select('_id user').lean().exec();
      if (exists) throw new ForbiddenException('You do not have access to this project');
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
