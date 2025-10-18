import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/common/types/authenticated-user';

import { SummariesService } from './summaries.service';
import { GetSummariesRangeDto } from './dto/get-summaries-range.dto';

@ApiTags('summaries')
@ApiBearerAuth('bearer')
@Controller('summaries')
@UseGuards(ApiKeyGuard)
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Get()
  async getTotalSummaries(@CurrentUser() user: AuthenticatedUser) {
    return await this.summariesService.getTotalSummaries(user._id);
  }

  @Get('range')
  async getSummariesRange(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetSummariesRangeDto
  ) {
    return await this.summariesService.getSummariesRange(user._id, query);
  }
}
