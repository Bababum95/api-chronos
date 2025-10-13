import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Project, ProjectDocument } from '@/schemas/project.schema';
import { CreateProjectInput, UpdateProjectInput } from '@/common/dto/validation-schemas';
import { createSuccessResponse } from '@/common/types/api-response.type';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  async create(dto: CreateProjectInput, userId: string) {
    // Check if project with same folder already exists for this user
    const existingProject = await this.projectModel.findOne({
      user: new Types.ObjectId(userId),
      project_folder: dto.project_folder,
    });

    if (existingProject) {
      throw new ConflictException('Project with this folder already exists');
    }

    const project = new this.projectModel({
      ...dto,
      user: new Types.ObjectId(userId),
      ...(dto.parent && { parent: new Types.ObjectId(dto.parent) }),
    });

    await project.save();
    return createSuccessResponse('Project created successfully', project);
  }

  async findAll(userId: string, query?: any) {
    const filter: any = { user: new Types.ObjectId(userId) };

    // Add optional filters from query
    if (query?.parent) {
      filter.parent = new Types.ObjectId(query.parent);
    }
    if (query?.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }
    if (query?.project_folder) {
      filter.project_folder = { $regex: query.project_folder, $options: 'i' };
    }

    const projects = await this.projectModel
      .find(filter)
      .populate('parent', 'name project_folder')
      .sort({ createdAt: -1 })
      .exec();

    return createSuccessResponse('Projects fetched successfully', projects);
  }

  async findOne(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid project ID');
    }

    const project = await this.projectModel
      .findById(id)
      .populate('parent', 'name project_folder')
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if project belongs to the user
    if (project.user.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return createSuccessResponse('Project fetched successfully', project);
  }

  async update(id: string, dto: UpdateProjectInput, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid project ID');
    }

    // First, check if project exists and belongs to user
    const existingProject = await this.projectModel.findById(id);

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    if (existingProject.user.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // If updating project_folder, check for duplicates
    if (dto.project_folder && dto.project_folder !== existingProject.project_folder) {
      const duplicateProject = await this.projectModel.findOne({
        user: new Types.ObjectId(userId),
        project_folder: dto.project_folder,
        _id: { $ne: new Types.ObjectId(id) },
      });

      if (duplicateProject) {
        throw new ConflictException('Project with this folder already exists');
      }
    }

    const updateData: any = { ...dto };
    if (dto.parent) {
      updateData.parent = new Types.ObjectId(dto.parent);
    }

    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('parent', 'name project_folder')
      .exec();

    return createSuccessResponse('Project updated successfully', updatedProject);
  }

  async remove(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid project ID');
    }

    const project = await this.projectModel.findById(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.user.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    await this.projectModel.findByIdAndDelete(id);

    return createSuccessResponse('Project deleted successfully', { id });
  }
}
