import { Controller, Get, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';

import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { parseOrThrow } from '../../common/utils/validation.utils';
import { SummariesQuerySchema } from '../../common/dto/validation-schemas';

import { SummariesService } from './summaries.service';

@Controller('summaries')
@UseGuards(ApiKeyGuard)
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Get()
  async getTotalSummaries(@CurrentUser() user: any) {
    return await this.summariesService.getTotalSummaries(user._id);
  }

  @Get('range')
  async getSummariesRange(@CurrentUser() user: any, @Query() query: any) {
    try {
      const validatedQuery = parseOrThrow<any>(SummariesQuerySchema, {
        start: query.start,
        end: query.end,
        full: query.full === 'true',
      });
      return await this.summariesService.getSummariesRange(
        user._id,
        validatedQuery,
        query.interval
      );
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
}
