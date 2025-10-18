import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types, PipelineStage } from 'mongoose';

import { Project, ProjectDocument } from '@/schemas/project.schema';
import { createSuccessResponse } from '@/common/types/api-response.type';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FindAllProjectsQueryDto } from './dto/find-all-query.dto';

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
    const { limit, page, root } = query;

    const filters: FilterQuery<ProjectDocument> = { user: userObjectId };
    if (root === true) filters.parent = { $exists: false };

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

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    // Never allow changing ownership
    const { parent, ...rest } = dto;

    const update: any = { ...rest };
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
