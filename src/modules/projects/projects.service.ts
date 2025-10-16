import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';

import { Project, ProjectDocument } from '@/schemas/project.schema';
import { createSuccessResponse } from '@/common/types/api-response.type';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

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

  async findAll(userId: string, query: any = {}) {
    const userObjectId = new Types.ObjectId(userId);

    const { limit, page, sort, ...rawFilters } = query || {};

    const filters: FilterQuery<ProjectDocument> = {
      ...rawFilters,
      user: userObjectId,
    } as any;

    // Ensure ObjectId casting for parent if provided
    if (filters.parent && typeof filters.parent === 'string') {
      try {
        filters.parent = new Types.ObjectId(filters.parent);
      } catch {
        // ignore invalid parent filter
        delete (filters as any).parent;
      }
    }

    const parsedLimit = Math.max(0, Number(limit ?? 0));
    const parsedPage = Math.max(1, Number(page ?? 1));

    const findQuery = this.projectModel.find(filters).lean();

    if (sort) {
      findQuery.sort(sort as any);
    }

    if (parsedLimit > 0) {
      findQuery.limit(parsedLimit).skip((parsedPage - 1) * parsedLimit);
    }

    const [items, total] = await Promise.all([
      findQuery.exec(),
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
