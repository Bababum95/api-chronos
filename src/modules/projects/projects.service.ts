import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';

import { Project, ProjectDocument } from '@/schemas/project.schema';
import { HourlyActivityDocument } from '@/schemas/hourly-activity.schema';
import { createSuccessResponse } from '@/common/types/api-response.type';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FindAllProjectsQuery } from './dto/find-all-query.dto';

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

  async findAll(userId: string, query: FindAllProjectsQuery = {}) {
    const userObjectId = new Types.ObjectId(userId);
    const { limit, page, root } = query;

    const filters: FilterQuery<ProjectDocument> = { user: userObjectId };
    if (root === true) filters.parent = { $exists: false };

    const parsedLimit = Math.max(0, Number(limit ?? 0));
    const parsedPage = Math.max(1, Number(page ?? 1));

    const aggregation: any[] = [
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

    if (parsedLimit > 0) {
      aggregation.push({ $skip: (parsedPage - 1) * parsedLimit });
      aggregation.push({ $limit: parsedLimit });
    }

    const [items, total] = await Promise.all([
      this.projectModel.aggregate(aggregation).exec(),
      this.projectModel.countDocuments(filters).exec(),
    ]);

    const response = {
      items,
      total,
      page: parsedLimit > 0 ? parsedPage : 1,
      limit: parsedLimit,
    };

    return createSuccessResponse('Projects fetched successfully', response);
  }

  async findOne(id: string, userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const project = await this.projectModel.findOne({ _id: id, user: userObjectId }).lean().exec();

    if (project) return project;

    // Differentiate between not found and forbidden (belongs to another user)
    const exists = await this.projectModel.findById(id).select('_id user').lean().exec();
    if (exists) {
      throw new ForbiddenException('You do not have access to this project');
    }

    throw new NotFoundException('Project not found');
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    // Never allow changing ownership
    const { parent, ...rest } = dto as any;

    const update: any = { ...rest };
    if (typeof parent !== 'undefined') {
      update.parent = parent ? new Types.ObjectId(parent) : null;
    }

    const updated = await this.projectModel
      .findOneAndUpdate({ _id: id, user: userObjectId }, update, { new: true, runValidators: true })
      .lean()
      .exec();

    if (updated) return updated;

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
