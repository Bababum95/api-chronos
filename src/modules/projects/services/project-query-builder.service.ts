import { Injectable } from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';

import { ProjectDocument } from '@/schemas/project.schema';

import { FindAllProjectsQueryDto } from '../dto/find-all-query.dto';

@Injectable()
export class ProjectQueryBuilderService {
  buildFindAllFilters(
    userId: string,
    query: FindAllProjectsQueryDto
  ): FilterQuery<ProjectDocument> {
    const { root, parent, includeArchived } = query;
    const filters: FilterQuery<ProjectDocument> = { user: new Types.ObjectId(userId) };

    if (root === true) {
      filters.$or = [{ parent: { $exists: false } }, { parent: null }];
    }

    if (parent) {
      filters.parent = new Types.ObjectId(parent);
    }

    if (includeArchived !== true) {
      filters.is_archived = { $ne: true };
    }

    return filters;
  }
}
